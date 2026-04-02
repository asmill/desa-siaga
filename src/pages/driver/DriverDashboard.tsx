import { useState, useEffect } from 'react';
import { Ambulance, MapPin, Navigation, CheckCircle, Phone, MessageCircle, AlertCircle, Power } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { useStore } from '../../store/useStore';

// Utility for calculating distance in KM (Haversine Formula)
function getDistanceKM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(1);
}

// Map Auto-Fit Component
function MapBounds({ coords1, coords2 }: { coords1: [number, number], coords2?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords1 && coords2) {
      const bounds = L.latLngBounds([coords1, coords2]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (coords1) {
      map.setView(coords1, 15);
    }
  }, [coords1, coords2, map]);
  return null;
}

// Custom Marker Icons
const patientIcon = L.divIcon({
  className: 'custom-icon',
  html: renderToString(
    <div style={{ backgroundColor: '#ef4444', padding: '8px', borderRadius: '50%', border: '2px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <MapPin size={24} color="white" />
    </div>
  ),
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const ambulanceIcon = L.divIcon({
  className: 'custom-icon',
  html: renderToString(
    <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', border: '2px solid #2563eb', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ambulance size={28} color="#2563eb" />
    </div>
  ),
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

export default function DriverDashboard() {
  const { activeSOS, acceptSOS, updateSOSStatus, resetSOS, driverStatus, setDriverStatus, userCoords } = useStore();
  const [route, setRoute] = useState<[number, number][]>([]);
  const [eta, setEta] = useState(0);

  // Calculate Distance to Patient in KM
  const distance = activeSOS 
    ? getDistanceKM(userCoords[0], userCoords[1], activeSOS.patientCoords[0], activeSOS.patientCoords[1]) 
    : '0';

  // Fetch route when SOS is accepted
  useEffect(() => {
    if (activeSOS?.status === 'ACCEPTED' && route.length === 0) {
      const getRoute = async () => {
        try {
          const start = userCoords; // Driver's current position (Puskesmas Cikalong)
          const end = activeSOS.patientCoords;
          const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            setRoute(coords);
            setEta(Math.ceil(data.routes[0].duration / 60));
          }
        } catch (err) {
          console.error('Routing error:', err);
        }
      };
      getRoute();
    }
  }, [activeSOS, userCoords, route.length]);

  const handleAccept = () => {
    // Simulasi atau gunakan nama Supir sungguhan
    acceptSOS('Supir ' + (useStore.getState().userProfile?.full_name || 'Ambulan')); 
  };

  const handleArrive = () => {
    updateSOSStatus('ARRIVED');
  };

  const handleComplete = () => {
    resetSOS();
    setRoute([]);
  };

  return (
    <div className="driver-layout" style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ambulance size={24} color="#2563eb" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Ambulans Desa</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: driverStatus === 'OFFLINE' ? '#cbd5e1' : '#10b981' }}></div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{driverStatus}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setDriverStatus(driverStatus === 'OFFLINE' ? 'STANDBY' : 'OFFLINE')}
          style={{ 
            padding: '8px 16px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, 
            display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer',
            backgroundColor: driverStatus === 'OFFLINE' ? '#10b981' : '#f1f5f9',
            color: driverStatus === 'OFFLINE' ? 'white' : '#64748b'
          }}
        >
          <Power size={14} /> {driverStatus === 'OFFLINE' ? 'Siaga' : 'Offline'}
        </button>
      </div>

      {/* Main Map Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={userCoords} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          <MapBounds coords1={userCoords} coords2={activeSOS?.patientCoords} />

          {/* Driver Position */}
          <Marker position={userCoords} icon={ambulanceIcon}>
            <Popup>Posisi Anda (Standby)</Popup>
          </Marker>

          {/* Patient Position if there is one */}
          {activeSOS && (
            <Marker position={activeSOS.patientCoords} icon={patientIcon}>
              <Popup>Lokasi Pasien: {activeSOS.patientName}</Popup>
            </Marker>
          )}

          {/* Route Line */}
          {route.length > 0 && (
            <Polyline positions={route} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.7 }} />
          )}
        </MapContainer>

        {/* Floating Info Overlay (Status Job) */}
        {(activeSOS?.status === 'ACCEPTED' || activeSOS?.status === 'ARRIVED') ? (
          <div style={{ position: 'absolute', bottom: '24px', left: '16px', right: '16px', zIndex: 1000 }}>
            <div className="card" style={{ padding: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tujuan Penjemputan</div>
                  <h3 style={{ margin: '4px 0', fontSize: '18px', fontWeight: 800 }}>{activeSOS.patientName}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
                      <Navigation size={14} /> {eta} Menit
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                      <MapPin size={14} /> {distance} KM
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#ecfdf5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <Phone size={20} />
                  </button>
                  <button style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: '#eff6ff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                    <MessageCircle size={20} />
                  </button>
                </div>
              </div>

              {activeSOS.status === 'ACCEPTED' ? (
                <button 
                  onClick={handleArrive}
                  className="btn btn-primary" 
                  style={{ width: '100%', backgroundColor: '#059669', display: 'flex', gap: '10px', padding: '16px', borderRadius: '12px' }}
                >
                  <CheckCircle size={20} /> Saya Sudah Tiba di Lokasi
                </button>
              ) : (
                <button 
                  onClick={handleComplete}
                  className="btn btn-primary" 
                  style={{ width: '100%', display: 'flex', gap: '10px', padding: '16px', borderRadius: '12px' }}
                >
                  <CheckCircle size={20} /> Selesaikan Tugas
                </button>
              )}
            </div>
          </div>
        ) : driverStatus === 'STANDBY' ? (
           <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, width: '90%', maxWidth: '400px' }}>
            <div className="card" style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', border: '1px solid #e2e8f0', borderRadius: '30px' }}>
               <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 2s infinite' }}></div>
               <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Menunggu Panggilan Darurat...</span>
            </div>
           </div>
        ) : null}
      </div>

      {/* Emergency Incoming Alert (Overlay Modal) */}
      {activeSOS?.status === 'PENDING' && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(220, 38, 38, 0.95)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', padding: '32px', textAlign: 'center', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'shake 0.5s infinite', borderRadius: '24px' }}>
            <div style={{ width: '80px', height: '80px', backgroundColor: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#ef4444' }}>
              <AlertCircle size={48} />
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: '#ef4444', margin: '0 0 8px 0', textTransform: 'uppercase' }}>DARURAT: {activeSOS.emergencyType}!</h2>
            <p style={{ fontSize: '16px', color: '#4b5563', margin: '0 0 16px 0', fontWeight: 600 }}>
              Panggilan darurat dari:<br/>
              <span style={{ fontSize: '20px', color: '#111827' }}>{activeSOS.patientName}</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', backgroundColor: '#fff1f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                 <MapPin size={16} color="#ef4444" />
                 <span style={{ fontSize: '14px', fontWeight: 700, color: '#991b1b' }}>Jarak: {distance} KM dari posisi Anda</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                 <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Metode Lokasi: {activeSOS.locationMethod}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => resetSOS()} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700 }}>Tolak</button>
              <button 
                onClick={handleAccept}
                style={{ flex: 2, padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: 800, fontSize: '16px', boxShadow: '0 8px 16px rgba(239, 68, 68, 0.3)' }}
              >
                Terima Sekarang
              </button>
            </div>
          </div>
          <style>{`
            @keyframes pulse {
              0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
              70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
              100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            @keyframes shake {
              0%, 100% { transform: translate(0, 0); }
              10% { transform: translate(-2px, -2px); }
              20% { transform: translate(2px, 2px); }
              30% { transform: translate(-2px, -2px); }
              40% { transform: translate(2px, 2px); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
