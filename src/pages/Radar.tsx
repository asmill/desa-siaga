import { useState, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from 'react-leaflet';
import { Activity, MapPin, Ambulance, User, Flame, Tornado, ShieldAlert, HeartPulse, Car, Zap, ShieldCheck } from 'lucide-react';
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

const getSOSIcon = (type: string, isDarkMode: boolean) => {
  let iconObj = <HeartPulse size={24} color="#ef4444" />;
  let color = '#ef4444';
  if (type === 'Kebakaran') { iconObj = <Flame size={24} color="#ea580c" />; color = '#ea580c'; }
  else if (type === 'Bencana Alam') { iconObj = <Tornado size={24} color="#0891b2" />; color = '#0891b2'; }
  else if (type === 'Kriminal') { iconObj = <ShieldAlert size={24} color={isDarkMode ? "#cbd5e1" : "#1e293b"} />; color = isDarkMode ? "#94a3b8" : "#1e293b"; }
  else if (type === 'Kecelakaan') { iconObj = <Car size={24} color="#f59e0b" />; color = '#f59e0b'; }
  
  return L.divIcon({
    className: 'custom-icon pulse-sos',
    html: renderToString(
      <div style={{ backgroundColor: isDarkMode ? '#0f172a' : 'white', padding: '10px', borderRadius: '50%', boxShadow: `0 0 20px ${color}`, border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {iconObj}
      </div>
    ),
    iconSize: [50, 50],
    iconAnchor: [25, 25]
  });
};

export default function Radar() {
  const { userCoords, role, driverStatus, userProfile, isDarkMode } = useStore();
  const [realAmbulances, setRealAmbulances] = useState<any[]>([]);
  const [activeEvents, setActiveEvents] = useState<any[]>([]);
  const [totalMitra, setTotalMitra] = useState(0);

  useEffect(() => {
    const fetchDrivers = async () => {
       const { data } = await supabase.from('profiles').select('*').in('role', ['Supir', 'Mitra']);
       if (data) {
          const validAmbulances = data.filter(d => d.role === 'Supir' && d.lat !== null && d.lat !== 0);
          setRealAmbulances(validAmbulances);
          setTotalMitra(data.filter(d => d.role === 'Mitra' && d.is_verified).length);
       }
    };
    
    const fetchSOS = async () => {
        const { data } = await supabase.from('sos_events').select('*, profiles:patient_id (photo_url)').in('status', ['PENDING', 'ACCEPTED']);
        if (data) setActiveEvents(data);
    };

    fetchDrivers();
    fetchSOS();

    // Subscribe to real-time changes
    const channel = supabase.channel('radar_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchDrivers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_events' }, () => fetchSOS())
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', paddingBottom: '70px', backgroundColor: 'var(--bg-color)' }}>
      <div style={{ padding: '24px 24px 24px 24px', backgroundColor: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
        <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <Activity size={24} color="var(--primary-red)" /> Command Center
        </h1>
        <p style={{ margin: '8px 0 16px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
          Memantau aktivitas Darurat (SOS) dan ketersediaan armada.
        </p>
        
        {/* 3 Box Status */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div className="card" style={{ padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Ambulance size={20} color="#3b82f6" />
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{realAmbulances.length}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Ambulans Aktif</div>
            </div>
            <div className="card" style={{ padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={20} color="#10b981" />
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{totalMitra}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Mitra Siaga</div>
            </div>
            <div className="card" style={{ padding: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                <Zap size={20} color="#ef4444" />
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{activeEvents.length}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SOS Diproses</div>
            </div>
        </div>
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

          {realAmbulances.filter(amb => amb.id !== userProfile?.id).map(amb => (
            <Marker key={amb.id} position={[amb.lat, amb.lng]} icon={ambulanceIcon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{amb.full_name}</strong>
                  <span style={{ 
                    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                    backgroundColor: '#d1fae5', color: '#059669'
                  }}>
                    {amb.driver_status || 'Supir Aktif'}
                  </span>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                    <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {amb.phone}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Active SOS Events & Command Routing Lines */}
          {activeEvents.map(evt => {
             const handlingDriver = realAmbulances.find(amb => amb.id === evt.driver_id);
             return (
               <div key={evt.id}>
                 {/* Live Target Destination Tracker */}
                 {handlingDriver && ['ACCEPTED', 'ARRIVED_AT_SCENE', 'EN_ROUTE_TO_HOSPITAL'].includes(evt.status) && (
                    <Polyline 
                      positions={[[handlingDriver.lat, handlingDriver.lng], [evt.patient_lat, evt.patient_lng]]} 
                      color="#ef4444" weight={3} dashArray="8, 12" className="pulse-sos" opacity={0.6}
                    />
                 )}
                 <Marker position={[evt.patient_lat, evt.patient_lng]} icon={getSOSIcon(evt.emergency_type, isDarkMode)}>
                    <Popup>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '180px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', backgroundImage: evt.profiles?.photo_url ? `url(${evt.profiles.photo_url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {!evt.profiles?.photo_url && <User size={20} color="#94a3b8" />}
                             </div>
                             <div>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>{evt.patient_name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Minta Bantuan</div>
                             </div>
                          </div>
                          <div style={{ padding: '8px', backgroundColor: evt.status === 'ACCEPTED' ? '#d1fae5' : '#fef2f2', borderRadius: '8px', color: evt.status === 'ACCEPTED' ? '#059669' : '#dc2626', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                             Tipe: {evt.emergency_type} <br/>
                             Status: {evt.status}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                             Ditangani oleh: {evt.driver_name || 'Menunggu Respons...'}
                          </div>
                       </div>
                    </Popup>
                 </Marker>
               </div>
             );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
