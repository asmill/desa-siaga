import { useState, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Activity, MapPin, Ambulance, User } from 'lucide-react';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ambulanceIcon = L.divIcon({
  className: 'custom-icon',
  html: renderToString(
    <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '2px solid var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ambulance size={28} color="var(--primary-red)" />
    </div>
  ),
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const userIcon = L.divIcon({
  className: 'custom-icon',
  html: renderToString(
    <div style={{ backgroundColor: 'var(--primary-red)', padding: '8px', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
      <User size={24} color="white" />
    </div>
  ),
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

export default function Radar() {
  const { userCoords, role, driverStatus, userProfile } = useStore();
  const [realAmbulances, setRealAmbulances] = useState<any[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
       const { data } = await supabase.from('profiles').select('*').eq('role', 'Supir');
       if (data) {
          // Filter out those who don't have lat/lng or it's simply [0,0]
          const validAmbulances = data.filter(d => d.lat !== null && d.lng !== null && d.lat !== 0);
          setRealAmbulances(validAmbulances);
       }
    };
    
    fetchDrivers();

    // Subscribe to real-time changes
    const channel = supabase.channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: "role=eq.'Supir'" }, (payload) => {
         setRealAmbulances(prev => {
            const newList = [...prev];
            const idx = newList.findIndex(d => d.id === payload.new.id);
            if (idx > -1) newList[idx] = payload.new;
            else newList.push(payload.new);
            return newList;
         });
      }).subscribe();
      
    return () => { supabase.removeChannel(channel); }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: '70px', backgroundColor: '#f8fafc' }}>
      <div style={{ padding: '24px 24px 16px 24px', backgroundColor: 'var(--primary-red)', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={24} /> Radar Siaga 3KM
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
          Memantau ketersediaan armada ambulans di sekitar Anda secara real-time.
        </p>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={userCoords} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Lokasi Pribadi (Sebagai Warga atau Supir) */}
          <Marker position={userCoords} icon={role === 'Supir' ? ambulanceIcon : userIcon}>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                 <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                   {role === 'Supir' ? `Ambulans Anda: ${userProfile?.full_name}` : 'Titik Posisi Anda (Warga)'}
                 </strong>
                 {role === 'Supir' && (
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                      backgroundColor: driverStatus === 'STANDBY' ? '#d1fae5' : '#fee2e2',
                      color: driverStatus === 'STANDBY' ? '#059669' : '#dc2626'
                    }}>
                      Status: {driverStatus}
                    </span>
                 )}
              </div>
            </Popup>
          </Marker>

          {/* 3KM Radius Circle */}
          <Circle 
            center={userCoords} 
            radius={3000} // 3,000 meters = 3km
            pathOptions={{ color: 'var(--primary-red)', fillColor: 'var(--primary-red)', fillOpacity: 0.1, weight: 1 }} 
          />

          {/* Real Ambulances from Supabase */}
          {realAmbulances.filter(amb => amb.id !== userProfile?.id).map(amb => (
            <Marker key={amb.id} position={[amb.lat, amb.lng]} icon={ambulanceIcon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{amb.full_name}</strong>
                  <span style={{ 
                    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                    backgroundColor: '#d1fae5', color: '#059669'
                  }}>
                    Supir Terdaftar
                  </span>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                    <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {amb.phone}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Legend Overlay */}
        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Status Armada Sistem</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>{realAmbulances.length}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Total Aktif</div>
            </div>
            <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>Realtime</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Sync Status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
