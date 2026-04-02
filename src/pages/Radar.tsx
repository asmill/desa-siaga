import { renderToString } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet';
import { Activity, MapPin, Ambulance, User, Settings2 } from 'lucide-react';
import L from 'leaflet';
import { useStore } from '../store/useStore';

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
  const { userCoords, role, driverStatus, setDriverStatus, userProfile, setUserCoords } = useStore();
  
  // Custom Map Component untuk menangkap kejadian GPS (Update Koordinat)
  function LocationMarker() {
    const map = useMapEvents({
      dblclick(e) {
        if (role === 'Supir') {
          // Hanya Supir yang bisa update manual state koordinat saat didouble-click
          setUserCoords([e.latlng.lat, e.latlng.lng]);
          map.flyTo(e.latlng, map.getZoom());
          alert('Berhasil memperbarui Posisi GPS Anda!');
        }
      },
      locationfound(e) {
         if (role === 'Supir') {
            setUserCoords([e.latlng.lat, e.latlng.lng]);
            map.flyTo(e.latlng, map.getZoom());
            alert('Berhasil mendapatkan Posisi Akurat GPS!');
         }
      }
    });

    return null;
  }

  // Auto-Update GPS location
  const handleUpdateGPS = () => {
     // Trigger L.map().locate() ideally, tapi karena kita tak pegang map instance di luar,
     // kita bisa gunakan navigator geolocation:
     if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition((pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          alert('GPS berhasil disinkronisasi dengan satelit!');
       }, () => {
          alert('Gagal membaca GPS. Izinkan lokasi browser atau ketuk ganda pada peta!');
       });
     }
  };

  // Simulasi 3 ambulans di sekitar user (radius < 10km)
  const mockAmbulances = [
    { id: 1, name: 'Ambulans Desa A', status: 'Tersedia', lat: userCoords[0] + 0.005, lng: userCoords[1] + 0.007, distance: '1.2 KM' },
    { id: 2, name: 'Ambulans Puskesmas', status: 'Sibuk', lat: userCoords[0] - 0.012, lng: userCoords[1] + 0.003, distance: '2.5 KM' },
    { id: 3, name: 'Ambulans Relawan', status: 'Tersedia', lat: userCoords[0] + 0.015, lng: userCoords[1] - 0.01, distance: '2.1 KM' },
  ];

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
          
          {/* Map Events Handler */}
          <LocationMarker />

          {/* Lokasi Pribadi (Sebagai Warga atau Ambulan Supir Pribadi) */}
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

          {/* Ambulances */}
          {mockAmbulances.map(amb => (
            <Marker key={amb.id} position={[amb.lat, amb.lng]} icon={ambulanceIcon}>
              <Popup>
                <div style={{ textAlign: 'center' }}>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>{amb.name}</strong>
                  <span style={{ 
                    display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                    backgroundColor: amb.status === 'Tersedia' ? '#d1fae5' : '#fee2e2',
                    color: amb.status === 'Tersedia' ? '#059669' : '#dc2626'
                  }}>
                    {amb.status}
                  </span>
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                    <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Jarak: {amb.distance}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Overlay Khusus Supir: Pengaturan Status dan Lokasi */}
        {role === 'Supir' ? (
          <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
               <h3 style={{ margin: 0, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}><Settings2 size={16} color="var(--primary-red)" /> Pengaturan Radar Supir</h3>
               <button 
                 onClick={handleUpdateGPS}
                 style={{ fontSize: '11px', padding: '6px 12px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '20px', fontWeight: 700 }}
               >
                 + Update Lokasi Radar
               </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
               <button 
                 onClick={() => setDriverStatus('STANDBY')}
                 style={{ 
                   padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: '2px solid',
                   borderColor: driverStatus === 'STANDBY' ? '#10b981' : '#e2e8f0',
                   backgroundColor: driverStatus === 'STANDBY' ? '#ecfdf5' : 'white',
                   color: driverStatus === 'STANDBY' ? '#059669' : '#64748b'
                 }}
               >
                 Tersedia (Siaga)
               </button>
               <button 
                 onClick={() => setDriverStatus('OFFLINE')}
                 style={{ 
                   padding: '10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: '2px solid',
                   borderColor: driverStatus === 'OFFLINE' ? '#ef4444' : '#e2e8f0',
                   backgroundColor: driverStatus === 'OFFLINE' ? '#fef2f2' : 'white',
                   color: driverStatus === 'OFFLINE' ? '#ef4444' : '#64748b'
                 }}
               >
                 Tidak Tersedia
               </button>
            </div>
            <p style={{ margin: '12px 0 0 0', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>Ketuk ganda pada titik peta untuk setel lokasi armada manual.</p>
          </div>
        ) : (
          <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10 }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Status Armada Terdekat</h3>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>2</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Tersedia</div>
              </div>
              <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>1</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Sedang Tugas</div>
              </div>
              <div style={{ width: '1px', backgroundColor: '#e2e8f0' }}></div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>Kondusif</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Status Area</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
