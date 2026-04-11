import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { CheckCircle, Navigation, Phone, AlertCircle, CalendarClock, MapPin, Activity, MessageCircle, ChevronLeft, User } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { supabase } from '../../services/supabaseClient';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';

const driverIcon = L.divIcon({
  className: 'custom-icon',
  html: renderToString(
    <div style={{ backgroundColor: '#2563eb', padding: '8px', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.2)', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Navigation size={20} color="white" />
    </div>
  ),
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const patientIcon = L.divIcon({
  className: 'custom-icon pulse-sos',
  html: renderToString(
    <div style={{ backgroundColor: '#ef4444', padding: '10px', borderRadius: '50%', boxShadow: '0 0 15px #ef4444', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AlertCircle size={24} color="white" />
    </div>
  ),
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

export default function DriverDashboard() {
  const { activeSOS, acceptSOS, updateSOSStatus, resetSOS, driverStatus, setDriverStatus, userCoords, setUserCoords, userProfile, chatMessages, sendChatMessage, showNotification } = useStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [historyLog, setHistoryLog] = useState<any[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>("RSUD Terpadu Subang (3KM)");
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [ambulancesList, setAmbulancesList] = useState<any[]>([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('');
  const [loadingShift, setLoadingShift] = useState(false);

  const faskesList = [
     { name: "RSUD Terpadu Subang (3KM)", coords: [-6.5610, 107.7610] as [number, number] },
     { name: "Klinik Bakti Medika (1KM)", coords: [-6.6110, 107.7610] as [number, number] },
     { name: "Puskesmas Jalancagak (2KM)", coords: [-6.6010, 107.7810] as [number, number] },
     { name: "RS PTPN VIII (6KM)", coords: [-6.5810, 107.7910] as [number, number] }
  ];

  // Fetch Peminjaman dari database (mocked for now inside DB if empty)
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await supabase.from('ambulance_bookings').select('*').order('created_at', { ascending: false });
        if (data) setBookings(data);
      } catch (err) {
        console.error(err);
      }
    };
    
    const fetchHistory = async () => {
      try {
         const { data } = await supabase.from('sos_events').select('*')
           .not('completed_at', 'is', null)
           .eq('driver_id', userProfile?.id)
           .order('completed_at', { ascending: false }).limit(5);
         if (data) setHistoryLog(data);
      } catch (err) { console.error("Error fetching logs", err); }
    };

    const fetchAmbulances = async () => {
       const { data } = await supabase.from('ambulances').select('*').order('id', { ascending: true });
       if (data) setAmbulancesList(data);
    };
    
    fetchBookings();
    fetchAmbulances();
    if(userProfile?.id) fetchHistory();
  }, [userProfile?.id]);

  const handleUpdateGPS = () => {
     if (navigator.geolocation) {
       navigator.geolocation.getCurrentPosition(
         async (pos) => {
            const newCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
            setUserCoords(newCoords);
            
            // Sync to Profile Supabase so Radar.tsx can pick it up (Phase 3 task)
            if (userProfile?.phone) {
               await supabase.from('profiles').update({ lat: newCoords[0], lng: newCoords[1] }).eq('phone', userProfile.phone);
            }
            showNotification('Lokasi GPS berhasil disinkronkan ke sistem Radar!', 'success');
         }, 
         () => showNotification('Gagal membaca GPS. Izinkan akses lokasi browser Anda!', 'error')
       );
     }
  };

  const renderStatusButton = (label: string, id: string, color: string, bgColor: string) => {
    const isActive = driverStatus === id;
    return (
      <button 
        onClick={() => setDriverStatus(id as any)}
        style={{
          padding: '16px', borderRadius: '16px', border: isActive ? `2px solid ${color}` : '2px solid #e2e8f0',
          backgroundColor: isActive ? bgColor : 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '8px', transition: 'all 0.2s', width: '100%'
        }}
      >
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color }}></div>
        <span style={{ fontSize: '14px', fontWeight: 700, color: isActive ? color : '#64748b' }}>{label}</span>
      </button>
    );
  };

  const handleStartShift = async () => {
     if (!selectedAmbulanceId) return showNotification('Pilih armada ambulans terlebih dahulu!', 'error');
     setLoadingShift(true);

     // Release any old ambulance to be sure
     await supabase.from('ambulances').update({ driver_id: null, status: 'Idle' }).eq('driver_id', userProfile?.id);
     
     // Bind driver to new ambulance and set Stand By
     const { error } = await supabase.from('ambulances').update({ 
       driver_id: userProfile?.id,
       status: 'Stand By'
     }).eq('id', selectedAmbulanceId);
     
     setLoadingShift(false);
     if (error) return showNotification('Gagal menghubungi unit.', 'error');
     
     // 1. OneSignal Login mapping driver's permanent ID to Device
     if (userProfile?.id) {
       await OneSignal.login(userProfile.id);
       // 2. Prompt Notification if they haven't allowed it yet!
       OneSignal.Slidedown.promptPush(); 
     }

     setDriverStatus('STANDBY');
     showNotification('Anda bersatus AKTIF (Online). Anda kini siaga!', 'success');
  };

  const handleEndShift = async () => {
     setLoadingShift(true);
     await supabase.from('ambulances').update({ driver_id: null, status: 'Idle' }).eq('driver_id', userProfile?.id);
     setDriverStatus('OFFLINE');
     setSelectedAmbulanceId('');
     setLoadingShift(false);
     showNotification('Anda telah NONAKTIF (Offline). Silakan beristirahat.', 'success');
  };

  return (
    <div style={{ padding: '24px', paddingBottom: '90px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>


      {/* SOS Alert Panel - Incoming SOS */}
      {activeSOS && activeSOS.status === 'PENDING' && driverStatus === 'STANDBY' && (
        <div className="card" style={{ border: '2px solid #ef4444', backgroundColor: '#fef2f2', padding: '20px' }}>
          {/* File suara sirine dipanggil dari folder public/sirine-sos.mp3 */}
          <audio src="/sirine-sos.mp3" autoPlay loop style={{ display: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }}></div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#ef4444', fontWeight: 800 }}>PANGGILAN DARURAT MASUK!</h2>
          </div>
          
          {/* Priority Indicator */}
          {activeSOS.targetedDriverId === userProfile?.id && (
            <div style={{ padding: '12px', backgroundColor: '#ef4444', color: 'white', fontWeight: 800, textAlign: 'center', borderRadius: '8px', marginBottom: '16px', fontSize: '15px' }}>
               🚨 PRIORITAS PENJEMPUTAN: ADA DI DEKAT ANDA (TERCEPAT)
            </div>
          )}
          
          <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} color="#ef4444" /> <strong>{activeSOS.emergencyType} - {activeSOS.patientName}</strong></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} color="#ef4444" /> Koordinat: {activeSOS.patientCoords[0].toFixed(4)}, {activeSOS.patientCoords[1].toFixed(4)}</div>
          </div>
          <button 
            onClick={() => acceptSOS(userProfile?.full_name || 'Supir Ambulans')}
            style={{ width: '100%', padding: '16px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
          >
            <CheckCircle size={20} /> TERIMA TUGAS INI
          </button>
        </div>
      )}
      
      {/* Handled by other driver info */}
      {activeSOS && activeSOS.status !== 'PENDING' && activeSOS.status !== 'COMPLETED' && activeSOS.status !== 'IDLE' && activeSOS.driverName !== userProfile?.full_name && (
         <div className="card" style={{ border: '2px solid #eab308', backgroundColor: '#fefce8', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={24} color="#eab308" />
            <div>
               <h4 style={{ margin: 0, color: '#ca8a04', fontSize: '15px' }}>Kasus Sudah Diambil!</h4>
               <p style={{ margin: 0, fontSize: '13px', color: '#854d0e' }}>Orderan SOS untuk {activeSOS.patientName} telah ditangani oleh <strong>{activeSOS.driverName}</strong>.</p>
            </div>
         </div>
      )}

      {/* Active Mission Panel - IMMERSIVE FULL SCREEN */}
      {activeSOS && activeSOS.status !== 'PENDING' && activeSOS.status !== 'COMPLETED' && activeSOS.status !== 'IDLE' && activeSOS.driverName === userProfile?.full_name && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'var(--bg-color)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          
          {/* Map Layer */}
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer center={activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? faskesList.find(f => f.name === activeSOS.destinationName)?.coords || activeSOS.patientCoords : activeSOS.patientCoords} zoom={14} style={{ height: '100%', width: '100%', zIndex: 0 }} zoomControl={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              {activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' && activeSOS.destinationName ? (
                <>
                  <Marker position={faskesList.find(f => f.name === activeSOS.destinationName)?.coords!} icon={patientIcon}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <strong style={{ fontSize: '14px', display: 'block', color: '#10b981' }}>Misi: Faskes Tujuan</strong>
                        {activeSOS.destinationName}
                      </div>
                    </Popup>
                  </Marker>
                  <Marker position={userCoords} icon={driverIcon}>
                    <Popup>Posisi Anda (Armada)</Popup>
                  </Marker>
                  <Polyline 
                    positions={[userCoords, faskesList.find(f => f.name === activeSOS.destinationName)?.coords!]} 
                    color="#10b981" 
                    weight={4} 
                    dashArray="10, 10" 
                    opacity={0.8}
                  />
                </>
              ) : (
                <>
                  <Marker position={activeSOS.patientCoords} icon={patientIcon}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <strong style={{ fontSize: '14px', display: 'block', color: '#ef4444' }}>Titik {activeSOS.emergencyType}</strong>
                        Pasien: {activeSOS.patientName}
                      </div>
                    </Popup>
                  </Marker>
                  <Marker position={userCoords} icon={driverIcon}>
                    <Popup>Posisi Anda (Armada)</Popup>
                  </Marker>
                  <Polyline 
                    positions={[userCoords, activeSOS.patientCoords]} 
                    color="#ef4444" 
                    weight={4} 
                    dashArray="10, 10" 
                    opacity={0.8}
                  />
                </>
              )}
            </MapContainer>

            {/* Floating Top Status Box */}
            <div style={{ position: 'absolute', top: '24px', left: '20px', right: '20px', zIndex: 1000 }}>
              <div className="card" style={{ borderLeft: `6px solid ${activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? '#3b82f6' : activeSOS.status === 'RETURNING_TO_BASE' ? '#64748b' : '#10b981'}`, padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                <div style={{ padding: '8px', backgroundColor: 'var(--bg-color)', borderRadius: '12px' }}>
                  <Navigation size={24} color={`${activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? '#3b82f6' : activeSOS.status === 'RETURNING_TO_BASE' ? '#64748b' : '#10b981'}`} /> 
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-main)', fontWeight: 800 }}>
                    {activeSOS.status === 'ACCEPTED' ? 'MENGARAH KE TKP' : 
                     activeSOS.status === 'ARRIVED_AT_SCENE' ? 'TELAH TIBA DI TKP' : 
                     activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? 'MENGANTAR KE FASKES' :
                     activeSOS.status === 'AT_DESTINATION' ? 'TIBA DI FASKES' : 'KEMBALI KE POS'}
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>Pasien: {activeSOS.patientName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Sheet Actions */}
          <div style={{ padding: '24px', backgroundColor: 'var(--surface-color)', borderTopLeftRadius: '24px', borderTopRightRadius: '24px', boxShadow: '0 -4px 16px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              <button onClick={() => setShowChat(true)} style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-color)', color: '#2563eb', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <MessageCircle size={18} /> Obrolan
              </button>
              <button style={{ flex: 1, padding: '12px', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: '14px', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} /> Telepon Pasien
              </button>
            </div>

            {activeSOS.status === 'ACCEPTED' && (
              <button onClick={() => updateSOSStatus('ARRIVED_AT_SCENE')} className="btn" style={{ width: '100%', padding: '18px', backgroundColor: '#10b981', color: 'white', borderRadius: '16px', fontSize: '16px', fontWeight: 800, boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>SAYA TELAH TIBA DI LOKASI (TKP)</button>
            )}
            
            {activeSOS.status === 'ARRIVED_AT_SCENE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'var(--bg-color)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>🏥 Pilih Faskes Tujuan Medis:</p>
                <select 
                  value={selectedDestination} 
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '15px', backgroundColor: 'var(--surface-color)', color: 'var(--text-main)', outline: 'none' }}
                >
                  {faskesList.map(faskes => <option key={faskes.name} value={faskes.name}>{faskes.name}</option>)} 
                </select>
                <button onClick={() => updateSOSStatus('EN_ROUTE_TO_HOSPITAL', selectedDestination)} className="btn btn-primary" style={{ width: '100%', padding: '18px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '16px', fontSize: '16px', fontWeight: 800, boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
                  BERANGKAT MENUJU FASKES
                </button>
              </div>
            )}
            
            {activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' && (
              <button onClick={() => updateSOSStatus('AT_DESTINATION')} className="btn" style={{ width: '100%', padding: '18px', backgroundColor: '#8b5cf6', color: 'white', borderRadius: '16px', fontSize: '16px', fontWeight: 800, boxShadow: '0 4px 12px rgba(139,92,246,0.3)' }}>TELAH TIBA DI FASKES TARGET</button>
            )}
            
            {activeSOS.status === 'AT_DESTINATION' && (
              <button onClick={() => updateSOSStatus('RETURNING_TO_BASE')} className="btn" style={{ width: '100%', padding: '18px', backgroundColor: '#f59e0b', color: 'white', borderRadius: '16px', fontSize: '16px', fontWeight: 800, boxShadow: '0 4px 12px rgba(245,158,11,0.3)' }}>SELESAI MENGANTAR - KEMBALI</button>
            )}

            {activeSOS.status === 'RETURNING_TO_BASE' && (
              <button onClick={() => resetSOS()} className="btn" style={{ width: '100%', padding: '18px', backgroundColor: '#059669', color: 'white', borderRadius: '16px', fontSize: '16px', fontWeight: 800, boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>TUGAS SELESAI / STANDBY</button>
            )}

            <button onClick={resetSOS} style={{ width: '100%', padding: '16px', backgroundColor: 'transparent', color: 'var(--primary-red)', border: '2px solid var(--border-color)', borderRadius: '16px', fontSize: '15px', fontWeight: 700, cursor: 'pointer' }}>🚨 Batalkan Paksa Misi</button>
          </div>
        </div>
      )}

      {/* Sync GPS Box */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '15px' }}>Pemosisian Satelit (GPS)</h3>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Pastikan rute pergerakan Anda selaras di Peta Radar Warga.</p>
        <button 
          onClick={handleUpdateGPS}
          style={{ padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Navigation size={18} /> Sync Lokasi GPS Terkini
        </button>
      </div>

      {/* Status Selector & Shift Panel */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '15px', color: '#334155' }}>Status Kesiapan Supir & Armada</h3>
        
        {driverStatus === 'OFFLINE' ? (
           <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
             <p style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#475569' }}>Anda Sedang OFFLINE</p>
             <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#64748b' }}>Pilih armada yang akan Anda gunakan sebelum mengaktifkan radar SOS.</p>
             
             <select 
               value={selectedAmbulanceId} 
               onChange={(e) => setSelectedAmbulanceId(e.target.value)}
               className="input-base"
               style={{ width: '100%', marginBottom: '12px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
             >
               <option value="">-- Pilih Kendaraan Menganggur --</option>
               {ambulancesList.filter(a => !a.driver_id).map(amb => (
                 <option key={amb.id} value={amb.id}>{amb.vehicle_name} ({amb.plate_number})</option>
               ))}
             </select>

             <button disabled={loadingShift} onClick={handleStartShift} className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>
                Go ONLINE (Mulai Berjaga)
             </button>
           </div>
        ) : (
           <div style={{ backgroundColor: '#ecfdf5', padding: '16px', borderRadius: '12px', border: '1px solid #10b981' }}>
             <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#047857' }}>Anda Sedang Bertugas (ONLINE)</p>
             <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#065f46' }}>Tekan Go Offline untuk mematikan notifikasi SOS. Kendaraan Anda otomatis kembali "Idle".</p>
             <button disabled={loadingShift} onClick={handleEndShift} className="btn" style={{ width: '100%', padding: '14px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '12px', fontWeight: 700 }}>
                Go OFFLINE (Istirahat / Selesai)
             </button>
           </div>
        )}

        {driverStatus !== 'OFFLINE' && (
          <>
            <h3 style={{ margin: '16px 0 0', fontSize: '13px', color: '#64748b' }}>Override Kondisi Darurat Manual:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {renderStatusButton('Stand By', 'STANDBY', '#10b981', '#ecfdf5')}
              {renderStatusButton('On Duty (Sibuk Luar)', 'ON_DUTY', '#64748b', '#f1f5f9')}
            </div>
          </>
        )}
      </div>

      {/* Tabel Jadwal Booking Ambulan */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><CalendarClock size={18} color="#2563eb" /> Jadwal Ambulans</h3>
           <span style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '4px', fontWeight: 700 }}>Menunggu ACC Pemdes</span>
        </div>
        
        {bookings.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bookings.map((b, idx) => (
               <div key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '13px' }}>{b.patient_name}</strong>
                    <span style={{ fontSize: '11px', color: b.status === 'APPROVED' ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{b.status}</span>
                 </div>
                 <div style={{ fontSize: '12px', color: '#64748b' }}>Tgl: {b.schedule_date} | Jam: {b.schedule_time}</div>
                 <div style={{ fontSize: '12px', color: '#64748b' }}>Tujuan: {b.destination}</div>
               </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>Tidak ada jadwal peminjaman saat ini.</p>
          </div>
        )}
      </div>
      {/* Tabel Laporan KPI Durasi Penanganan Darurat */}
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <h3 style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} color="#059669" /> Laporan Penanganan Darurat</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                 <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 6px' }}>Tanggal</th>
                    <th style={{ padding: '10px 6px' }}>Nama Pasien</th>
                    <th style={{ padding: '10px 6px' }}>Jenis Darurat</th>
                    <th style={{ padding: '10px 6px', textAlign: 'center' }}>Total Waktu Respon</th>
                 </tr>
              </thead>
              <tbody>
                 {historyLog.length > 0 ? historyLog.map((log: any, idx: number) => {
                    // Total waktu respon: dari accept_at sampai at_destination_at
                    const tAccept = log.accepted_at ? new Date(log.accepted_at).getTime() : 0;
                    const tDest   = log.at_destination_at ? new Date(log.at_destination_at).getTime() : 0;
                    const totalMenit = (tAccept && tDest) ? Math.ceil((tDest - tAccept) / 60000) : null;
                    const totalLabel = totalMenit !== null
                      ? totalMenit >= 60
                        ? `${Math.floor(totalMenit/60)}j ${totalMenit%60}m`
                        : `${totalMenit} menit`
                      : '-';
                    
                    const tgl = log.created_at
                      ? new Date(log.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'2-digit' })
                      : '-';

                    return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '12px 6px', color: '#64748b', whiteSpace: 'nowrap' }}>{tgl}</td>
                           <td style={{ padding: '12px 6px', fontWeight: 600, color: '#1e293b' }}>{log.patient_name || '-'}</td>
                           <td style={{ padding: '12px 6px' }}>
                             <span style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600 }}>
                               {log.emergency_type || '-'}
                             </span>
                           </td>
                           <td style={{ padding: '12px 6px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>{totalLabel}</td>
                        </tr>
                    )
                 }) : (
                    <tr>
                       <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Belum ada riwayat penyelesaian tugas.</td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
      
      {/* Chat Modal for Driver */}
      {showChat && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 2000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#2563eb', color: 'white' }}>
            <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' }}>
              <ChevronLeft size={28} />
            </button>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: '16px' }}>Saluran Khusus Warga</h4>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Pasien: {activeSOS?.patientName}</p>
            </div>
          </div>
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
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
          <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', backgroundColor: 'white' }}>
            <input 
              type="text" 
              style={{ flex: 1, padding: '12px 16px', borderRadius: '20px', border: '1px solid #cbd5e1', outline: 'none' }}
              placeholder="Beritahu warga estimasi Anda..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                 if(e.key === 'Enter' && newMessage.trim()) {
                    sendChatMessage(newMessage);
                    setNewMessage('');
                 }
              }}
            />
            <button 
              onClick={() => {
                 if(newMessage.trim()){
                    sendChatMessage(newMessage);
                    setNewMessage('');
                 }
              }} 
              style={{ padding: '0 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 600, cursor: 'pointer' }}>
              Kirim
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
