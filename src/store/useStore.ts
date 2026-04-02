import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../services/supabaseClient';

export type UserRole = 'Admin' | 'DPMD' | 'PEMDES' | 'Relawan' | 'Mitra' | 'Masyarakat' | 'Supir';
export type SOSStatus = 'IDLE' | 'PENDING' | 'ACCEPTED' | 'ARRIVED' | 'COMPLETED';

interface ActiveSOS {
  id?: string;
  patientName: string;
  patientCoords: [number, number];
  status: SOSStatus;
  driverName?: string;
  eta?: number;
  emergencyType: string;
  locationMethod: string;
}

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string;
}

export type DriverStatusType = 'STANDBY' | 'ON_JOB' | 'OFFLINE' | 'ON_RESPONSE' | 'ON_DUTY';

interface AppState {
  userProfile: UserProfile | null;
  role: UserRole;
  isVerified: boolean;
  userCoords: [number, number];
  activeSOS: ActiveSOS | null;
  driverStatus: DriverStatusType;
  
  setUserProfile: (profile: UserProfile | null) => void;
  setRole: (role: UserRole) => void;
  setIsVerified: (status: boolean) => void;
  setUserCoords: (coords: [number, number]) => void;
  
  // SOS Actions
  triggerSOS: (name: string, coords: [number, number], emergencyType: string, locationMethod: string) => void;
  acceptSOS: (driverName: string) => void;
  updateSOSStatus: (status: SOSStatus) => void;
  resetSOS: () => void;
  
  // Driver Actions
  setDriverStatus: (status: DriverStatusType) => void;
}

// Create a Supabase Realtime channel for global network sync
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      userProfile: null,
      role: 'Masyarakat',
      isVerified: true, 
      userCoords: [-6.621000, 107.771000], 
      activeSOS: null,
      driverStatus: 'STANDBY',

      setUserProfile: (profile) => set({ userProfile: profile }),
      setRole: (role) => set({ role }),
      setIsVerified: (status) => set({ isVerified: status }),
      setUserCoords: (coords) => set({ userCoords: coords }),

      triggerSOS: async (name, coords, emergencyType, locationMethod) => {
        const { userProfile } = get();
        if (!userProfile) return;

        // Insert into Supabase
        const { data, error } = await supabase.from('sos_events').insert({
          patient_id: userProfile.id,
          patient_name: name,
          patient_lat: coords[0],
          patient_lng: coords[1],
          emergency_type: emergencyType,
          location_method: locationMethod,
          status: 'PENDING'
        }).select().single();

        if (error) {
          console.error('[SYNC] Error triggering SOS', error);
          return;
        }

        const activeSOS = { id: data.id, patientName: name, patientCoords: coords as [number, number], status: 'PENDING' as SOSStatus, emergencyType, locationMethod };
        set({ activeSOS });
        console.log(`[SYNC] Sending SOS: ${name}`, activeSOS);
      },
      acceptSOS: async (driverName) => {
        const { activeSOS, userProfile } = get();
        if (activeSOS && activeSOS.id && userProfile) {
          const { error } = await supabase.from('sos_events').update({ 
            status: 'ACCEPTED', 
            driver_id: userProfile.id, 
            driver_name: driverName 
          }).eq('id', activeSOS.id);

          if (!error) {
            set({ driverStatus: 'ON_JOB' });
            console.log(`[SYNC] Accepting SOS: ${driverName}`);
          }
        }
      },
      updateSOSStatus: async (status) => {
        const { activeSOS } = get();
        if (activeSOS && activeSOS.id) {
          await supabase.from('sos_events').update({ status }).eq('id', activeSOS.id);
        }
      },
      resetSOS: async () => {
        const { activeSOS } = get();
        if (activeSOS && activeSOS.id) {
            // Ideally we mark it COMPLETED directly rather than delete, or client just resets local state
            await supabase.from('sos_events').update({ status: 'COMPLETED' }).eq('id', activeSOS.id);
        }
        set({ activeSOS: null, driverStatus: 'STANDBY' });
      },
      
      setDriverStatus: (status) => set({ driverStatus: status })
    }),
    {
      name: 'desasiaga-storage',
    }
  )
);

// Subscribe to Supabase Postgres Changes
if (typeof window !== 'undefined') {
  // Listen for SOS_EVENTS table
  supabase.channel('public:sos_events')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_events' }, (payload) => {
      console.log(`[SYNC] Database SOS Update:`, payload);
      
      // If a new SOS or an updated SOS is received
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const data = payload.new as any;
        const mappedSOS: ActiveSOS = {
          id: data.id,
          patientName: data.patient_name,
          patientCoords: [data.patient_lat, data.patient_lng],
          status: data.status as SOSStatus,
          emergencyType: data.emergency_type,
          locationMethod: data.location_method,
          driverName: data.driver_name
        };
        
        if (mappedSOS.status === 'COMPLETED') {
           useStore.setState({ activeSOS: null, driverStatus: 'STANDBY' });
        } else {
           useStore.setState({ activeSOS: mappedSOS });
        }
      } else if (payload.eventType === 'DELETE') {
         useStore.setState({ activeSOS: null, driverStatus: 'STANDBY' });
      }
    }).subscribe();

  // Listen for PROFILES table to automatically update role if admin changes it
  supabase.channel('public:profiles')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
      const { userProfile } = useStore.getState();
      if (userProfile && payload.new.id === userProfile.id) {
        console.log(`[SYNC] Role/Profile updated from server:`, payload.new);
        useStore.setState({ 
          role: payload.new.role as UserRole,
          isVerified: payload.new.is_verified
        });
      }
    }).subscribe();
}
