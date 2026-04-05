import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../services/supabaseClient';

export type UserRole = 'Admin' | 'DPMD' | 'PEMDES' | 'Relawan' | 'Mitra' | 'Masyarakat' | 'Supir';
export type SOSStatus = 'IDLE' | 'PENDING' | 'ACCEPTED' | 'ARRIVED_AT_SCENE' | 'EN_ROUTE_TO_HOSPITAL' | 'AT_DESTINATION' | 'RETURNING_TO_BASE' | 'COMPLETED';

interface ActiveSOS {
  id?: string;
  patientName: string;
  patientCoords: [number, number];
  status: SOSStatus;
  driverName?: string;
  targetedDriverId?: string;
  destinationName?: string;
  eta?: number;
  emergencyType: string;
  locationMethod: string;
}

export interface SOSMessage {
  id: string;
  sender_name: string;
  sender_id: string;
  message: string;
  created_at: string;
}

// Distance Helper (Haversine Formula) in KM
export function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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
  chatMessages: SOSMessage[];
  notification: { show: boolean, message: string, type: 'success' | 'error' | 'info' } | null;
  
  setUserProfile: (profile: UserProfile | null) => void;
  setRole: (role: UserRole) => void;
  setIsVerified: (status: boolean) => void;
  setUserCoords: (coords: [number, number]) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  
  // SOS Actions
  triggerSOS: (name: string, coords: [number, number], emergencyType: string, locationMethod: string) => void;
  acceptSOS: (driverName: string) => void;
  updateSOSStatus: (status: SOSStatus, destinationName?: string) => void;
  resetSOS: () => void;
  
  // Chat Actions
  sendChatMessage: (message: string) => void;
  fetchChatMessages: (eventId: string) => void;
  
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
      chatMessages: [],
      notification: null,

      setUserProfile: (profile) => set({ userProfile: profile }),
      setRole: (role) => set({ role }),
      setIsVerified: (status) => set({ isVerified: status }),
      setUserCoords: (coords) => set({ userCoords: coords }),
      
      showNotification: (message, type = 'info') => {
        set({ notification: { show: true, message, type } });
        // Auto hide after 3.5s
        setTimeout(() => {
           const current = get().notification;
           if (current?.message === message) set({ notification: null });
        }, 3500);
      },

      triggerSOS: async (name, coords, emergencyType, locationMethod) => {
        const { userProfile } = get();
        if (!userProfile) return;

        let targetedDriverId = null;
        
        // Find closest standby driver
        try {
          const { data: drivers } = await supabase.from('profiles').select('*')
              .eq('role', 'Supir')
              .eq('driver_status', 'STANDBY');
          
          if (drivers && drivers.length > 0) {
             let minDistance = Infinity;
             for (const d of drivers) {
                if (d.lat && d.lng) {
                   const dist = getDistance(coords[0], coords[1], d.lat, d.lng);
                   if (dist < minDistance) {
                      minDistance = dist;
                      targetedDriverId = d.id;
                   }
                }
             }
          }
        } catch(e) {
          console.error("Failed to find closest driver", e);
        }

        // Insert into Supabase
        const { data, error } = await supabase.from('sos_events').insert({
          patient_id: userProfile.id,
          patient_name: name,
          patient_lat: coords[0],
          patient_lng: coords[1],
          emergency_type: emergencyType,
          location_method: locationMethod,
          status: 'PENDING',
          targeted_driver_id: targetedDriverId
        }).select().single();

        if (error) {
          console.error('[SYNC] Error triggering SOS', error);
          return;
        }

        const activeSOS = { id: data.id, patientName: name, patientCoords: coords as [number, number], status: 'PENDING' as SOSStatus, emergencyType, locationMethod, targetedDriverId };
        set({ activeSOS });
      },
      acceptSOS: async (driverName) => {
        const { activeSOS, userProfile } = get();
        if (activeSOS && activeSOS.id && userProfile) {
          const { error } = await supabase.from('sos_events').update({ 
            status: 'ACCEPTED', 
            accepted_at: new Date().toISOString(),
            driver_id: userProfile.id, 
            driver_name: driverName 
          }).eq('id', activeSOS.id);

          if (!error) {
            await supabase.from('ambulances').update({ status: 'On Response (Menuju TKP)' }).eq('driver_id', userProfile.id);
            set({ driverStatus: 'ON_RESPONSE' });
            get().setDriverStatus('ON_RESPONSE'); // To trigger DB sync
          }
        }
      },
      updateSOSStatus: async (status, destinationName) => {
        const { activeSOS } = get();
        if (activeSOS && activeSOS.id) {
          const updateData: any = { status };
          if (status === 'ARRIVED_AT_SCENE') {
             updateData.arrived_at = new Date().toISOString();
             await supabase.from('ambulances').update({ status: 'On Response (Tiba di TKP)' }).eq('driver_id', activeSOS.targetedDriverId || get().userProfile?.id);
          }
          if (status === 'EN_ROUTE_TO_HOSPITAL') {
             updateData.en_route_hospital_at = new Date().toISOString();
             if (destinationName) updateData.destination_name = destinationName;
             await supabase.from('ambulances').update({ status: `On Response (Menuju ${destinationName})` }).eq('driver_id', activeSOS.targetedDriverId || get().userProfile?.id);
          }
          if (status === 'AT_DESTINATION') {
             updateData.at_destination_at = new Date().toISOString();
             await supabase.from('ambulances').update({ status: 'On Response (Tiba di Faskes)' }).eq('driver_id', activeSOS.targetedDriverId || get().userProfile?.id);
          }
          if (status === 'RETURNING_TO_BASE') {
             updateData.returning_at = new Date().toISOString();
             await supabase.from('ambulances').update({ status: 'On Response (Kembali ke Desa)' }).eq('driver_id', activeSOS.targetedDriverId || get().userProfile?.id);
          }
          
          await supabase.from('sos_events').update(updateData).eq('id', activeSOS.id);
        }
      },
      resetSOS: async () => {
        const { activeSOS } = get();
        if (activeSOS && activeSOS.id) {
            await supabase.from('sos_events').update({ 
                status: 'COMPLETED',
                completed_at: new Date().toISOString()
            }).eq('id', activeSOS.id);
        }
        
        const { userProfile } = get();
        if (userProfile?.id) {
           await supabase.from('ambulances').update({ status: 'Stand By' }).eq('driver_id', userProfile.id);
        }

        set({ activeSOS: null, driverStatus: 'STANDBY', chatMessages: [] });
        get().setDriverStatus('STANDBY'); // sync
      },
      
      sendChatMessage: async (message) => {
         const { activeSOS, userProfile } = get();
         if (!activeSOS || !activeSOS.id || !userProfile) return;
         
         await supabase.from('sos_messages').insert({
            event_id: activeSOS.id,
            sender_id: userProfile.id,
            sender_name: userProfile.full_name,
            message: message
         });
      },
      
      fetchChatMessages: async (eventId) => {
         const { data } = await supabase.from('sos_messages').select('*').eq('event_id', eventId).order('created_at', { ascending: true });
         if (data) {
            set({ chatMessages: data });
         }
      },
      
      setDriverStatus: async (status) => {
         set({ driverStatus: status });
         const { userProfile } = get();
         if (userProfile) {
            await supabase.from('profiles').update({ driver_status: status }).eq('id', userProfile.id);
         }
      }
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
          driverName: data.driver_name,
          targetedDriverId: data.targeted_driver_id,
          destinationName: data.destination_name
        };
        
        if (mappedSOS.status === 'COMPLETED') {
           useStore.setState({ activeSOS: null, driverStatus: 'STANDBY', chatMessages: [] });
        } else {
           useStore.setState({ activeSOS: mappedSOS });
           // If a new SOS started from nowhere and we didn't have chat, fetch chat
           const { chatMessages } = useStore.getState();
           if (chatMessages.length === 0) {
               useStore.getState().fetchChatMessages(mappedSOS.id!);
           }
        }
      } else if (payload.eventType === 'DELETE') {
         useStore.setState({ activeSOS: null, driverStatus: 'STANDBY', chatMessages: [] });
      }
    }).subscribe();

  // Listen for Chat Messages Table
  supabase.channel('public:sos_messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_messages' }, (payload) => {
       const newMsg = payload.new as SOSMessage;
       const { activeSOS, chatMessages } = useStore.getState();
       
       if (activeSOS && activeSOS.id === payload.new.event_id) {
          useStore.setState({ chatMessages: [...chatMessages, newMsg] });
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
