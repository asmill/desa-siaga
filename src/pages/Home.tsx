import { useState, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import { PhoneCall, User, CheckCircle2, AlertTriangle, Activity, ChevronLeft, Ambulance, MessageCircle, Siren, Loader2, HeartPulse, Car, Baby, Plus, Map as MapIcon, LocateFixed, Flame, Tornado, ShieldAlert, Volume2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../App.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Dynamic Emergency Icon based on Type
const getEmergencyIcon = (type: string) => {
  let iconComponent;
  let borderColor;
  if (type === 'Jantung' || type === 'Medis') { iconComponent = <HeartPulse size={28} color="#ef4444" />; borderColor = '#ef4444'; }
  else if (type === 'Kecelakaan') { iconComponent = <Car size={28} color="#f59e0b" />; borderColor = '#f59e0b'; }
  else if (type === 'Melahirkan') { iconComponent = <Baby size={28} color="#8b5cf6" />; borderColor = '#8b5cf6'; }
  else if (type === 'Kebakaran') { iconComponent = <Flame size={28} color="#ea580c" />; borderColor = '#ea580c'; }
  else if (type === 'Bencana Alam') { iconComponent = <Tornado size={28} color="#0891b2" />; borderColor = '#0891b2'; }
  else if (type === 'Kriminal') { iconComponent = <ShieldAlert size={28} color="#1e293b" />; borderColor = '#1e293b'; }
  else { iconComponent = <Plus size={28} color="#64748b" />; borderColor = '#64748b'; }

  return L.divIcon({
    className: 'custom-icon',
    html: renderToString(
      <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', border: `2px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {iconComponent}
      </div>
    ),
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
};

// Custom Ambulance Icon for SOS - Synchronized with Radar.tsx
const customSOSIcon = L.divIcon({
  className: 'custom-icon',
  html: renderToString(
    <div style={{ backgroundColor: 'white', padding: '8px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', border: '2px solid var(--primary-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Ambulance size={28} color="var(--primary-red)" />
    </div>
  ),
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

// Custom User Icon for Map - Synchronized with Radar.tsx
const customUserIcon = L.divIcon({
  className: 'custom-icon',
  html: renderToString(
    <div style={{ backgroundColor: 'var(--primary-red)', padding: '8px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
      <User size={24} color="white" />
    </div>
  ),
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

import { useNavigate } from 'react-router-dom';

// Helper component to focus map on route
function MapFocus({ route }: { route: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [route, map]);
  return null;
}

// Helper to keep the MapCenter synced when customLocation state updates
function MapCenterSync({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, map.getZoom(), { animate: true, duration: 0.5 });
  }, [coords, map]);
  return null;
}

const MitraHomeDashboard = ({ sosHistory, userProfile }: { sosHistory: any[], userProfile: any }) => {
  const generateMonthlyReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Laporan Bulanan SOS - Mitra: ${userProfile?.mitraCategory} (${userProfile?.full_name})`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Periode Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);
    
    const tableColumn = ["Waktu", "Status", "Pasien", "Tipe Darurat", "Penolong"];
    const tableRows: any[] = [];
    
    sosHistory.forEach(s => {
      tableRows.push([
         new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
         s.status,
         s.patient_name || 'NN',
         s.emergency_type,
         s.driver_name || '-'
      ]);
    });
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68] }
    });
    
    doc.save(`Laporan_SOS_${userProfile?.mitraCategory}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="home-content">
      <div className="card" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Beranda Mitra Siaga</h2>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Memonitor aktivitas darurat relevan di wilayah Anda.</p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px' }}>Notifikasi SOS Terkini</h3>
          <div style={{ padding: '4px 12px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '12px', fontSize: '12px', fontWeight: 700 }}>
            {sosHistory.length} Kasus Filtered
          </div>
        </div>
        <div>
          {sosHistory.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Belum ada data riwayat SOS untuk kategori instansi Anda.
            </div>
          ) : (
            sosHistory.slice(0, 10).map((item, index) => (
              <div key={item.id} style={{ padding: '16px', display: 'flex', gap: '16px', borderBottom: index < Math.min(sosHistory.length, 10) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Activity size={20} color="var(--primary-red)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{item.emergency_type}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <User size={12} /> {item.patient_name || 'Tidak ada'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <CheckCircle2 size={12} /> Status: {item.status}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
          <button onClick={generateMonthlyReport} className="btn" style={{ width: '100%', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 700, fontSize: '14px' }}>
            Unduh Laporan Bulanan (PDF)
          </button>
        </div>
      </div>
    </div>
  );
};


export default function Home() {
  const { isVerified, userProfile, userCoords, activeSOS, triggerSOS, resetSOS, role, chatMessages, sendChatMessage, showNotification } = useStore();
  const navigate = useNavigate();
  const [searchingProgress, setSearchingProgress] = useState(0);
  
  // Role-based redirection: Drivers should always be on /driver
  useEffect(() => {
    if (role === 'Supir') {
      navigate('/driver', { replace: true });
    }
  }, [role, navigate]);

  // UI States & SOS Wizard
  const [sosStep, setSosStep] = useState(0); // 0=idle, 1=type, 2=location mode, 3=map picker
  const [selectedType, setSelectedType] = useState('Lainnya');
  const [customLocation, setCustomLocation] = useState<[number, number]>(userCoords);
  const [showChat, setShowChat] = useState(false);
  const [sosLocation, setSosLocation] = useState<[number, number]>(userCoords);
  const [newMessage, setNewMessage] = useState('');
  const [ambCoords, setAmbCoords] = useState<[number, number]>([-6.621000, 107.771000]); 
  const [route, setRoute] = useState<[number, number][]>([]);
  const [eta, setEta] = useState(15);
  
  const [sosHistory, setSosHistory] = useState<any[]>([]);
  const [ambulancesList, setAmbulancesList] = useState<any[]>([]);

  // Fetch tables
  useEffect(() => {
    if (!userProfile) return;
    const fetchHomeData = async () => {
       // 1. Fetch SOS History
       let query = supabase.from('sos_events').select('*').order('created_at', { ascending: false });
       if (role === 'Masyarakat') {
          query = query.eq('patient_id', userProfile.id).eq('status', 'COMPLETED').limit(20);
       } else if (role === 'Mitra') {
          query = query.limit(100); // Admin / Mitra get all to filter later
       }
       
       const { data: histObj } = await query;
       if (histObj) {
          if (role === 'Mitra') {
             const category = userProfile?.mitraCategory || '';
             const relevant = histObj.filter(s => {
                if (category === 'Klinik' || category === 'Kader' || category === 'Bidan') {
                   return ['Medis', 'Melahirkan', 'Kecelakaan'].includes(s.emergency_type);
                }
                if (category === 'Babinsa' || category === 'Kamtibmas') {
                   return ['Tindak Kriminal', 'Kecelakaan', 'Bencana Alam', 'Kebakaran'].includes(s.emergency_type);
                }
                if (category === 'Pemadam') {
                   return ['Kebakaran'].includes(s.emergency_type);
                }
                if (category === 'Linmas') {
                   return true; // Linmas sees all
                }
                return true;
             });
             setSosHistory(relevant);
          } else {
             setSosHistory(histObj);
          }
       }

       // 2. Fetch Ambulances Status
       const { data: ambObj } = await supabase.from('ambulances')
          .select('*')
          .order('id', { ascending: true });
       if (ambObj) setAmbulancesList(ambObj);
    };
    fetchHomeData();
    
    // Subscribe to ambulance updates to keep it realtime
    const sub = supabase.channel('public:ambulances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ambulances' }, () => {
         fetchHomeData();
      }).subscribe();
      
    return () => { supabase.removeChannel(sub); };
  }, [userProfile]);

  // Derived status from global store
  const status = activeSOS?.status || 'IDLE';

  useEffect(() => {
    let timer: any;
    if (status === 'PENDING') {
      timer = setInterval(() => {
        setSearchingProgress(prev => {
          if (prev >= 100) return 100;
          return prev + 2; 
        });
      }, 500);
    } else {
      setSearchingProgress(0);
    }
    return () => clearInterval(timer);
  }, [status]);

  // Fetch Route from OSRM when driver accepts
  useEffect(() => {
    if (status === 'ACCEPTED' && route.length === 0) {
      const getRoute = async () => {
        try {
          const start = [-6.621000, 107.771000]; 
          const end = sosLocation;
          const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (data.routes && data.routes[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            setRoute(coords);
            setAmbCoords(coords[0]);
            setEta(Math.ceil(data.routes[0].duration / 60));
          }
        } catch (err) {
          console.error('Routing failed', err);
        }
      };
      getRoute();
    }
  }, [status, sosLocation, route.length]);

  // Simulation: Move ambulance if driver hasn't actually connected yet (for demo)
  useEffect(() => {
    let animInterval: any;
    if (status === 'ACCEPTED' && route.length > 0) {
      let currentIndex = 0;
      animInterval = setInterval(() => {
        currentIndex++;
        if (currentIndex >= route.length) {
          // This would ideally be triggered by the DRIVER app
          // For demo purposes, we can keep it here or wait for driver update
          clearInterval(animInterval);
          return;
        }
        setAmbCoords(route[currentIndex]);
        const remainingPercent = 1 - (currentIndex / route.length);
        setEta(Math.max(1, Math.ceil(remainingPercent * 10)));
      }, 1000); 
    }
    return () => clearInterval(animInterval);
  }, [status, route]);

  const handleSOSClick = () => {
    if (!isVerified) {
      showNotification('Akun Anda belum Diverifikasi oleh Pemerintah Desa. Tombol Darurat belum aktif.', 'error');
      return;
    }
    setCustomLocation(userCoords); // Reset to default
    setSosStep(1);
  };

  const [isGettingGPS, setIsGettingGPS] = useState(false);

  const confirmSOS = (method: 'GPS' | 'CUSTOM', customCoords?: [number, number]) => {
    setSosStep(0);
    setIsGettingGPS(true);
    setAmbCoords([-6.621000, 107.771000]); 
    setRoute([]);
    setEta(15);
    
    const sendSOS = (coords: [number, number], sourceMethod: string) => {
      setSosLocation(coords);
      triggerSOS(userProfile?.full_name || 'Pasien', coords, selectedType, sourceMethod);
      setIsGettingGPS(false);
    };

    if (method === 'CUSTOM' && customCoords) {
      sendSOS(customCoords, 'Titik Peta Manual');
      return;
    }

    if ("geolocation" in navigator) {
      const timeout = setTimeout(() => {
        showNotification('GPS lambat. Ambulan diarahkan ke Alamat Rumah.', 'error');
        sendSOS(userCoords, 'Otomatis (Akurasi Rendah)');
      }, 5000);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeout);
          const freshCoords: [number, number] = [position.coords.latitude, position.coords.longitude];
          sendSOS(freshCoords, 'GPS Handphone');
        },
        () => {
          clearTimeout(timeout);
          showNotification('Akses GPS ditolak. Ambulan diarahkan ke Alamat Rumah.', 'error');
          sendSOS(userCoords, 'Otomatis (Akurasi Rendah)');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      showNotification('GPS tidak didukung peramban. Menggunakan Alamat Rumah.', 'error');
      sendSOS(userCoords, 'Otomatis (Akurasi Rendah)');
    }
  };

  const cancelSOS = () => {
    resetSOS();
    setSosStep(0);
  };

  // --- MITRA DASHBOARD RENDER ---
  if (role !== 'Masyarakat' && role !== 'Supir') {
     return <MitraHomeDashboard sosHistory={sosHistory} userProfile={userProfile} />;
  }

  // --- RENDER BLOCKERS ---
  if (isGettingGPS) {
    return (
      <div className="home-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <Loader2 className="animate-spin" size={48} color="var(--primary-red)" />
        <h2 className="text-title" style={{ marginTop: '24px' }}>Mencari Lokasi GPS...</h2>
        <p className="text-subtitle" style={{ textAlign: 'center' }}>Sedang mengambil koordinat terkini Anda agar bantuan sampai di titik yang tepat.</p>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="home-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', position: 'relative', overflow: 'hidden' }}>
        <div className="radar-animation" style={{ 
          width: '240px', 
          height: '240px', 
          borderRadius: '50%', 
          border: '2px solid var(--primary-red)', 
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '40px'
        }}>
          <div style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            animation: 'radarPulse 2s infinite'
          }} />
          <Ambulance size={64} color="var(--primary-red)" style={{ position: 'absolute', animation: 'bounce 2s infinite' }} />
        </div>

        <h2 className="text-title" style={{ marginTop: '0' }}>{searchingProgress < 40 ? 'Menghubungi Supir...' : searchingProgress < 80 ? 'Menunggu Konfirmasi...' : 'Supir Mengonfirmasi...'}</h2>
        <p className="text-subtitle" style={{ textAlign: 'center', marginTop: '8px' }}>Panggilan Anda sedang diteruskan ke armada terdekat.</p>
        
        <div style={{ width: '100%', maxWidth: '200px', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginTop: '24px', overflow: 'hidden' }}>
          <div style={{ width: `${searchingProgress}%`, height: '100%', backgroundColor: 'var(--primary-red)', transition: 'width 0.5s ease' }} />
        </div>

        <button onClick={cancelSOS} className="btn" style={{ marginTop: '48px', border: '1px solid var(--primary-red)', color: 'var(--primary-red)', backgroundColor: 'transparent' }}>
          Batalkan Panggilan
        </button>

        <style>{`
          @keyframes radarPulse {
            0% { transform: scale(0.8); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    );
  }

  if (['ACCEPTED', 'ARRIVED_AT_SCENE', 'EN_ROUTE_TO_HOSPITAL'].includes(status)) {
    
    // Dynamic styling based on status
    let statusTitle = 'Ambulans Sedang Meluncur!';
    let statusDesc = `Estimasi tiba: ${eta} Menit. Harap bersiap.`;
    let mainColor = '#dc2626';
    let bgColor = '#fef2f2';
    
    if (status === 'ARRIVED_AT_SCENE') {
       statusTitle = 'Ambulans Telah Tiba di Lokasi!';
       statusDesc = 'Silakan bersiap untuk naik ke unit.';
       mainColor = '#059669';
       bgColor = '#d1fae5';
    } else if (status === 'EN_ROUTE_TO_HOSPITAL') {
       statusTitle = 'Sedang Menuju Rumah Sakit';
       statusDesc = 'Membawa pasien ke Fasilitas Kesehatan terdekat.';
       mainColor = '#2563eb';
       bgColor = '#eff6ff';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-color)', overflow: 'hidden' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer center={userCoords} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            
            {/* User Location */}
            <Marker position={sosLocation} icon={customUserIcon}>
              <Popup>Lokasi Darurat Anda</Popup>
            </Marker>

            {/* Ambulance Location */}
            <Marker position={ambCoords} icon={customSOSIcon}>
              <Popup>Ambulans Siaga</Popup>
            </Marker>

            {/* Show Route Polyline if dispatched */}
            {status === 'ACCEPTED' && route.length > 0 && (
              <>
                <Polyline 
                  positions={route as any} 
                  pathOptions={{ 
                    color: 'var(--primary-red)', 
                    weight: 4, 
                    opacity: 0.6,
                    dashArray: '8, 8'
                  }} 
                />
                <MapFocus route={route} />
              </>
            )}
          </MapContainer>

          <div style={{ position: 'absolute', top: 20, left: 20, right: 20, zIndex: 1000 }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--surface-color)', borderLeft: `6px solid ${mainColor}`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
              <div style={{ padding: '8px', backgroundColor: bgColor, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {status === 'ACCEPTED' ? <Siren size={32} color={mainColor} className="animate-pulse" /> : <CheckCircle2 size={32} color={mainColor} />}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: status === 'ACCEPTED' ? 'var(--text-main)' : mainColor, margin: 0 }}>
                  {statusTitle}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0', fontWeight: 500 }}>
                  {statusDesc}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '24px', backgroundColor: 'var(--surface-color)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="var(--text-muted)" />
            </div>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>{activeSOS?.driverName || 'Supardi'} (Supir)</h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Ambulans Siaga Desa</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setShowChat(true)} 
                title="Tanya Supir"
                style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
              >
                <MessageCircle size={22} color="#2563eb" />
              </button>
              <button className="btn btn-primary" style={{ padding: '0 20px', height: '44px', display: 'flex', gap: '10px', borderRadius: '22px' }}>
                <PhoneCall size={18} />
                <span style={{ fontWeight: 600 }}>Panggil</span>
              </button>
            </div>
          </div>
          {status === 'ACCEPTED' && (
            <button onClick={cancelSOS} className="btn" style={{ width: '100%', backgroundColor: '#fef2f2', color: 'var(--primary-red)', border: 'none' }}>
              Batalkan Darurat
            </button>
          )}
          {(status === 'EN_ROUTE_TO_HOSPITAL' || status === 'ARRIVED_AT_SCENE') && (
            <div style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)', marginTop: '10px', padding: '10px', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              Proses sedang berlangsung. Anda tidak dapat membatalkan lagi.
            </div>
          )}
        </div>

        {/* Chat Modal */}
        {showChat && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-color)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'var(--primary-red)', color: 'white' }}>
              <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
                <ChevronLeft size={28} />
              </button>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: 0, fontSize: '16px' }}>Chat dengan Supir</h4>
                <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Supardi - T 1234 XY</p>
              </div>
            </div>
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatMessages.map((msg, i) => {
                 const isMe = msg.sender_id === userProfile?.id;
                 const timeStr = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                 return (
                <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%', display: 'flex', gap: '10px', alignItems: 'flex-end', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                  {/* Photo Avatar */}
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, backgroundColor: '#e2e8f0', backgroundImage: msg.sender_photo ? `url(${msg.sender_photo})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                     {!msg.sender_photo && <User size={18} color="#94a3b8" />}
                  </div>
                  <div>
                    <div style={{ 
                      padding: '12px 16px', 
                      borderRadius: '16px', 
                      backgroundColor: isMe ? '#2563eb' : 'var(--surface-color)',
                      color: isMe ? 'white' : 'var(--text-main)',
                      borderBottomRightRadius: isMe ? '4px' : '16px',
                      borderBottomLeftRadius: isMe ? '16px' : '4px',
                      boxShadow: '0 3px 6px rgba(0,0,0,0.08)',
                      border: isMe ? 'none' : '1px solid var(--border-color)',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {msg.message}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                      {msg.sender_name} • {timeStr}
                    </div>
                  </div>
                </div>
                 );
              })}
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                className="input-base" 
                placeholder="Ketik pesan..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button onClick={handleSendMessage} className="btn btn-primary" style={{ padding: '0 16px' }}>Kirim</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function handleSendMessage() {
    if (!newMessage.trim()) return;
    sendChatMessage(newMessage);
    setNewMessage('');
  }

  // --- MAIN HOME VIEW ---
  return (
    <div className="home-content" style={{ paddingBottom: '100px' }}>
      {!isVerified && (
        <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <AlertTriangle color="#d97706" style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <h4 style={{ color: '#b45309', margin: 0, fontSize: '14px' }}>Akun Belum Verifikasi</h4>
              <p style={{ color: '#d97706', margin: 0, fontSize: '13px' }}>Fitur darurat dibatasi. Masukkan kode OTP yang dikirim ke HP Anda.</p>
            </div>
            <button 
              onClick={() => window.location.href = '/otp'}
              style={{ backgroundColor: '#b45309', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, width: 'fit-content', cursor: 'pointer' }}>
              Verifikasi Sekarang
            </button>
          </div>
        </div>
      )}

      <div className="sos-container" style={{ margin: '80px auto 60px' }}>
        <button className="btn-sos" onClick={handleSOSClick} style={{ opacity: isVerified ? 1 : 0.5, transform: sosStep > 0 ? 'scale(0.95)' : 'scale(1)', gap: '8px' }}>
          <Volume2 size={48} color="rgba(255, 255, 255, 0.9)" />
          <span style={{ fontSize: '32px' }}>SOS</span>
        </button>
      </div>

      {/* Dashboard Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* TABEL AMBULAN DESA */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Ambulance size={18} color="var(--primary-red)" />
              Monitor Ambulan Desa
            </h2>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', backgroundColor: 'white', padding: '4px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>{ambulancesList.length} Unit Total</span>
          </div>
          
          {ambulancesList.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Belum ada armada ambulan.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ambulancesList.map((item, index) => {
                const getStatusColor = (st: string) => {
                   if (st.includes('On Response')) return { bg: '#fef2f2', text: '#dc2626' };
                   if (st === 'MAINTENANCE') return { bg: '#fef3c7', text: '#d97706' };
                   if (st === 'Stand By') return { bg: '#ecfdf5', text: '#059669' };
                   return { bg: '#f1f5f9', text: '#64748b' }; // Idle
                };
                const colors = getStatusColor(item.status || 'MAINTENANCE');
                return (
                 <div key={item.id} style={{ padding: '16px 20px', display: 'flex', gap: '16px', borderBottom: index < ambulancesList.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                   <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <Ambulance size={20} color={colors.text} />
                   </div>
                   <div style={{ flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                       <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{item.plate_number}</h4>
                       <span style={{ fontSize: '10px', fontWeight: 800, color: colors.text, backgroundColor: colors.bg, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                         {item.status || 'MAINTENANCE'}
                       </span>
                     </div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                       <div style={{ fontSize: '12px', color: 'var(--text-main)' }}>{item.model}</div>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                         <User size={12} /> Supir Aktif: {item.driver_name ? item.driver_name : <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>Kosong</span>}
                       </div>
                     </div>
                   </div>
                 </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TABEL RIWAYAT DARURAT */}
        <div style={{ backgroundColor: 'white', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
              <Activity size={18} color="#2563eb" />
              Riwayat Darurat Anda
            </h2>
          </div>
          
          {sosHistory.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>Belum ada riwayat panggilan.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="print-only" style={{ padding: '20px', display: 'none' }}>
                <h3>Laporan Riwayat Darurat {userProfile?.full_name}</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                  <thead>
                    <tr><th style={{ border: '1px solid #000', padding: '8px' }}>Jenis</th><th style={{ border: '1px solid #000', padding: '8px' }}>Tanggal</th><th style={{ border: '1px solid #000', padding: '8px' }}>Supir</th></tr>
                  </thead>
                  <tbody>
                    {sosHistory.map(item => (
                      <tr key={item.id}><td style={{ border: '1px solid #000', padding: '8px' }}>{item.emergency_type}</td><td style={{ border: '1px solid #000', padding: '8px' }}>{new Date(item.created_at).toLocaleDateString('id-ID')}</td><td style={{ border: '1px solid #000', padding: '8px' }}>{item.driver_name}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="no-print">
                {sosHistory.slice(0, 4).map((item, index) => (
                  <div key={item.id} style={{ padding: '16px 20px', display: 'flex', gap: '16px', borderBottom: index < Math.min(sosHistory.length, 4) - 1 ? '1px solid var(--border-color)' : 'none' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                       <CheckCircle2 size={20} color="#059669" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>{item.emergency_type}</h4>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                          <User size={12} /> Supir Penolong: {item.driver_name || 'Tidak ada'}
                        </div>
                        {item.completed_at && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                            <PhoneCall size={12} /> Waktu Selesai: {new Date(item.completed_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {sosHistory.length > 0 && (
                  <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
                     <button onClick={() => window.print()} className="btn" style={{ padding: '10px 20px', borderRadius: '12px', backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 600, fontSize: '13px' }}>
                       Lihat Semua Riwayat (Download PDF)
                     </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SOS Wizard Modal */}
      {sosStep > 0 && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          
          <div className="card" style={{ width: '100%', maxWidth: '500px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, padding: 0, animation: 'slideUp 0.3s ease-out', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {sosStep > 1 && (
                <button onClick={() => setSosStep(sosStep - 1)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }}>
                   <ChevronLeft size={24} color="#64748b" />
                </button>
              )}
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                {sosStep === 1 ? 'Pilih Jenis Darurat' : sosStep === 2 ? 'Tentukan Lokasi Anda' : 'Geser Titik Lokasi'}
              </h3>
            </div>

            {/* Step 1: Jenis Darurat */}
            {sosStep === 1 && (
              <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { id: 'Medis', icon: <HeartPulse size={30} />, color: '#ef4444', desc: 'Sakit Medis' },
                  { id: 'Kecelakaan', icon: <Car size={30} />, color: '#f59e0b', desc: 'Kecelakaan' },
                  { id: 'Kebakaran', icon: <Flame size={30} />, color: '#ea580c', desc: 'Kebakaran' },
                  { id: 'Bencana Alam', icon: <Tornado size={30} />, color: '#0891b2', desc: 'Bencana Alam' },
                  { id: 'Melahirkan', icon: <Baby size={30} />, color: '#8b5cf6', desc: 'Melahirkan' },
                  { id: 'Kriminal', icon: <ShieldAlert size={30} />, color: '#1e293b', desc: 'Tindak Kriminal' }
                ].map((type) => (
                  <button 
                    key={type.id}
                    onClick={() => { setSelectedType(type.id); setSosStep(2); }}
                    style={{ 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '16px 12px', 
                      backgroundColor: 'transparent', border: 'none', cursor: 'pointer', transition: 'transform 0.1s',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <div style={{ padding: '16px', borderRadius: '50%', backgroundColor: 'white', border: `2px solid ${type.color}`, color: type.color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.06)' }}>
                      {type.icon}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155' }}>{type.desc}</div>
                    </div>
                  </button>
                ))}
                
                <button className="btn" onClick={() => setSosStep(0)} style={{ gridColumn: 'span 2', marginTop: '8px', backgroundColor: '#f1f5f9', color: '#64748b' }}>Batal</button>
              </div>
            )}

            {/* Step 2: Lokasi */}
            {sosStep === 2 && (
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <button 
                  onClick={() => confirmSOS('GPS')}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LocateFixed size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#1d4ed8' }}>Gunakan GPS Handphone</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#3b82f6', lineHeight: 1.4 }}>Otomatis membaca kordinat akurat Anda saat ini. (Rekomendasi jika Anda berada di luar rumah)</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setSosStep(3);
                    if ("geolocation" in navigator) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setCustomLocation([position.coords.latitude, position.coords.longitude]);
                        },
                        () => {}, 
                        { enableHighAccuracy: true, timeout: 5000 }
                      );
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapIcon size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#334155' }}>Pilih Manual di Peta</h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: 1.4 }}>Pilih jika GPS HP salah mendeteksi blok perumahan atau titik Anda terkini.</p>
                  </div>
                </button>

              </div>
            )}

            {/* Step 3: Peta Mini (Picker) */}
            {sosStep === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '60vh' }}>
                <div style={{ padding: '16px', backgroundColor: '#fffbeb', borderBottom: '1px solid #fcd34d', fontSize: '13px', color: '#b45309', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <AlertTriangle size={16} /> Geser layar hingga pin merah berada tepat di lokasi Anda.
                </div>
                
                <div style={{ flex: 1, position: 'relative' }}>
                  <MapContainer 
                    center={customLocation} 
                    zoom={16} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <MapCenterSync coords={customLocation} />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    
                    <Marker position={customLocation} icon={getEmergencyIcon(selectedType)} draggable={true} eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const position = marker.getLatLng();
                        setCustomLocation([position.lat, position.lng]);
                      }
                    }} />
                  </MapContainer>
                </div>
                
                <div style={{ padding: '24px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0' }}>
                  <button onClick={() => confirmSOS('CUSTOM', customLocation)} className="btn btn-primary" style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: '12px' }}>
                    Selesai & Panggil Ambulans
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
