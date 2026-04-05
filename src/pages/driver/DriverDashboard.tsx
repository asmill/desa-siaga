import { useState, useEffect } from 'react';
import { CheckCircle, Navigation, Phone, AlertCircle, CalendarClock, MapPin, Activity, MessageCircle, ChevronLeft } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { supabase } from '../../services/supabaseClient';

export default function DriverDashboard() {
  const { activeSOS, acceptSOS, updateSOSStatus, resetSOS, driverStatus, setDriverStatus, setUserCoords, userProfile, chatMessages, sendChatMessage, showNotification } = useStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [historyLog, setHistoryLog] = useState<any[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>("RSUD Terpadu Subang (3KM)");
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [ambulancesList, setAmbulancesList] = useState<any[]>([]);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('');
  const [loadingShift, setLoadingShift] = useState(false);

  const dummyHospitals = [
     "RSUD Terpadu Subang (3KM)",
     "Klinik Bakti Medika (1KM)",
     "Puskesmas Jalancagak (2KM)",
     "RS PTPN VIII (6KM)"
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
     if (!selectedAmbulanceId) return showNotification('Silakan pilih ambulan terlebih dahulu', 'error');
     setLoadingShift(true);
     // Release existing ambulance if this driver used it (cleaning)
     await supabase.from('ambulances').update({ driver_id: null, driver_name: null, status: 'Idle' }).eq('driver_id', userProfile?.id);
     
     // Bind driver to new ambulance
     const { error } = await supabase.from('ambulances').update({ 
       driver_id: userProfile?.id, 
       driver_name: userProfile?.full_name,
       status: 'Stand By'
     }).eq('id', selectedAmbulanceId);
     
     setLoadingShift(false);
     if (error) return showNotification('Gagal mengunci unit. Coba lagi.', 'error');
     
     setDriverStatus('STANDBY');
     showNotification('Shift Domisili dimulai. Anda kini siaga!', 'success');
  };

  const handleEndShift = async () => {
     setLoadingShift(true);
     await supabase.from('ambulances').update({ driver_id: null, driver_name: null, status: 'Idle' }).eq('driver_id', userProfile?.id);
     setDriverStatus('OFFLINE');
     setLoadingShift(false);
     showNotification('Piket selesai. Silakan beristirahat.', 'success');
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

      {/* Active Mission Panel */}
      {activeSOS && activeSOS.status !== 'PENDING' && activeSOS.status !== 'COMPLETED' && activeSOS.status !== 'IDLE' && activeSOS.driverName === userProfile?.full_name && (
        <div className="card" style={{ border: `2px solid ${activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? '#3b82f6' : activeSOS.status === 'RETURNING_TO_BASE' ? '#64748b' : '#10b981'}`, backgroundColor: `${activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? '#eff6ff' : activeSOS.status === 'RETURNING_TO_BASE' ? '#f1f5f9' : '#ecfdf5'}`, padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', color: `${activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? '#1d4ed8' : activeSOS.status === 'RETURNING_TO_BASE' ? '#334155' : '#047857'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={18} /> 
            {activeSOS.status === 'ACCEPTED' ? 'MENGARAH KE TITIK DARURAT' : 
             activeSOS.status === 'ARRIVED_AT_SCENE' ? 'TELAH TIBA DI LOKASI TKP' : 
             activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? 'MENGANTAR MENUJU RUMAH SAKIT' :
             activeSOS.status === 'AT_DESTINATION' ? 'TIBA DI RUMAH SAKIT' : 'PERJALANAN KEMBALI KE POS'}
          </h2>
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'white', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700 }}>Pasien: {activeSOS.patientName}</p>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>Jenis Darurat: {activeSOS.emergencyType}</p>
            {activeSOS.destinationName && (
               <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#ca8a04', fontWeight: 600 }}>Tujuan: {activeSOS.destinationName}</p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setShowChat(true)} style={{ flex: 1, padding: '10px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <MessageCircle size={16} /> Buka Obrolan
              </button>
              <button style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                <Phone size={14} /> Telepon
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeSOS.status === 'ACCEPTED' && (
              <button onClick={() => updateSOSStatus('ARRIVED_AT_SCENE')} style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Konfirmasi Tiba di TKP (Pasien Naik)</button>
            )}
            
            {activeSOS.status === 'ARRIVED_AT_SCENE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#e2e8f0', padding: '16px', borderRadius: '12px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 600 }}>Pilih Faskes Tujuan:</p>
                <select 
                  value={selectedDestination} 
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                >
                  {dummyHospitals.map(faskes => <option key={faskes} value={faskes}>{faskes}</option>)}
                </select>
                <button onClick={() => updateSOSStatus('EN_ROUTE_TO_HOSPITAL', selectedDestination)} style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  Berangkat Mengantar Ke Faskes Tujuan
                </button>
              </div>
            )}
            
            {activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' && (
              <button onClick={() => updateSOSStatus('AT_DESTINATION')} style={{ width: '100%', padding: '14px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Sampai Faskes Tujuan (Selesai Mengantar)</button>
            )}
            
            {activeSOS.status === 'AT_DESTINATION' && (
              <button onClick={() => updateSOSStatus('RETURNING_TO_BASE')} style={{ width: '100%', padding: '14px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Kembali Ke Desa (Meninggalkan RS)</button>
            )}

            {activeSOS.status === 'RETURNING_TO_BASE' && (
              <button onClick={() => resetSOS()} style={{ width: '100%', padding: '14px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Tiba di Desa (Tugas Selesai / Standby)</button>
            )}

            <button onClick={resetSOS} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Batalkan Paksa Tugas Ini</button>
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
        <h3 style={{ margin: 0, fontSize: '15px', color: '#334155' }}>Sistem Piket (Shift)</h3>
        
        {driverStatus === 'OFFLINE' ? (
           <div style={{ backgroundColor: '#f1f5f9', padding: '16px', borderRadius: '12px' }}>
             <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#475569' }}>Ambil kendali unit ambulans untuk mulai dinas.</p>
             <select 
               value={selectedAmbulanceId} 
               onChange={(e) => setSelectedAmbulanceId(e.target.value)}
               className="input-base"
               style={{ width: '100%', marginBottom: '12px' }}
             >
               <option value="">-- Pilih Kendaraan Menganggur --</option>
               {ambulancesList.filter(a => !a.driver_id).map(amb => (
                 <option key={amb.id} value={amb.id}>{amb.plate_number} - {amb.model}</option>
               ))}
             </select>
             <button disabled={loadingShift} onClick={handleStartShift} className="btn btn-primary" style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>
                Mulai Piket Hari Ini
             </button>
           </div>
        ) : (
           <div style={{ backgroundColor: '#ecfdf5', padding: '16px', borderRadius: '12px', border: '1px solid #10b981' }}>
             <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700, color: '#047857' }}>Anda Sedang Bertugas</p>
             <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#065f46' }}>Tekan Selesai Piket untuk melepas unit ke pool agar supir lain bisa giliran.</p>
             <button disabled={loadingShift} onClick={handleEndShift} className="btn" style={{ width: '100%', padding: '14px', backgroundColor: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '12px', fontWeight: 700 }}>
                Selesai Piket (Kembalikan Kunci)
             </button>
           </div>
        )}

        <h3 style={{ margin: '16px 0 0', fontSize: '13px', color: '#64748b' }}>Override Status Darurat:</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {renderStatusButton('Stand By', 'STANDBY', '#10b981', '#ecfdf5')}
          {renderStatusButton('On Duty (Repot)', 'ON_DUTY', '#64748b', '#f1f5f9')}
        </div>
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
                 <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '10px 4px' }}>Pasien (Jenis)</th>
                    <th style={{ padding: '10px 4px' }}>Respon</th>
                    <th style={{ padding: '10px 4px' }}>Ke TKP</th>
                    <th style={{ padding: '10px 4px' }}>Ngantar RS</th>
                    <th style={{ padding: '10px 4px' }}>Total Penuh</th>
                 </tr>
              </thead>
              <tbody>
                 {historyLog.length > 0 ? historyLog.map((log, idx) => {
                    const tStart = log.created_at ? new Date(log.created_at).getTime() : 0;
                    const tAccept = log.accepted_at ? new Date(log.accepted_at).getTime() : 0;
                    const tArrive = log.arrived_at ? new Date(log.arrived_at).getTime() : 0;
                    const tHospital = log.en_route_hospital_at ? new Date(log.en_route_hospital_at).getTime() : 0;
                    const tDestination = log.at_destination_at ? new Date(log.at_destination_at).getTime() : 0;
                    const tComplete = log.completed_at ? new Date(log.completed_at).getTime() : 0;

                    const diffRespon = tAccept && tStart ? Math.ceil((tAccept - tStart)/60000) + 'm' : '-';
                    const diffTKP = tArrive && tAccept ? Math.ceil((tArrive - tAccept)/60000) + 'm' : '-';
                    const diffTrip = tDestination && tHospital ? Math.ceil((tDestination - tHospital)/60000) + 'm' : '-';
                    const diffTotal = tComplete && tStart ? Math.ceil((tComplete - tStart)/60000) + 'm' : '-';

                    return (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                           <td style={{ padding: '12px 4px' }}><strong>{log.patient_name || '-'}</strong><br/><span style={{fontSize:'10px', color:'#94a3b8'}}>{log.emergency_type}</span></td>
                           <td style={{ padding: '12px 4px' }}>{diffRespon}</td>
                           <td style={{ padding: '12px 4px' }}>{diffTKP}</td>
                           <td style={{ padding: '12px 4px' }}>{diffTrip}</td>
                           <td style={{ padding: '12px 4px', color: '#059669', fontWeight: 700 }}>{diffTotal}</td>
                        </tr>
                    )
                 }) : (
                    <tr>
                       <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Belum ada riwayat penyelesaian tugas.</td>
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
                <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                  <div style={{ 
                    padding: '12px 16px', 
                    borderRadius: '16px', 
                    backgroundColor: isMe ? '#2563eb' : '#e2e8f0',
                    color: isMe ? 'white' : '#1e293b',
                    borderBottomRightRadius: isMe ? '4px' : '16px',
                    borderBottomLeftRadius: isMe ? '16px' : '4px',
                  }}>
                    {msg.message}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                    {msg.sender_name} • {timeStr}
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
