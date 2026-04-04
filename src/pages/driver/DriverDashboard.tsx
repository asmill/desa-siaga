import { useState, useEffect } from 'react';
import { Ambulance, CheckCircle, Navigation, Phone, AlertCircle, CalendarClock, MapPin } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { supabase } from '../../services/supabaseClient';

export default function DriverDashboard() {
  const { activeSOS, acceptSOS, updateSOSStatus, resetSOS, driverStatus, setDriverStatus, setUserCoords, userProfile } = useStore();
  const [bookings, setBookings] = useState<any[]>([]);

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
    fetchBookings();
  }, []);

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
            alert('Lokasi GPS berhasil disinkronkan ke sistem Radar!');
         }, 
         () => alert('Gagal membaca GPS. Izinkan akses lokasi browser Anda!')
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

  return (
    <div style={{ padding: '24px', paddingBottom: '90px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Header Info */}
      <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Pusat Kendali Supir</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Ambulans Desa Siaga</p>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '50%' }}>
          <Ambulance size={28} color="#2563eb" />
        </div>
      </div>

      {/* SOS Alert Panel - Incoming SOS */}
      {activeSOS && activeSOS.status === 'PENDING' && (
        <div className="card" style={{ border: '2px solid #ef4444', backgroundColor: '#fef2f2', padding: '20px' }}>
          <audio src="https://assets.mixkit.co/active_storage/sfx/1041/1041-preview.mp3" autoPlay loop style={{ display: 'none' }} />
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
        <div className="card" style={{ border: `2px solid ${activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? '#3b82f6' : '#10b981'}`, backgroundColor: `${activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? '#eff6ff' : '#ecfdf5'}`, padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '16px', color: `${activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' ? '#1d4ed8' : '#047857'}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation size={18} /> 
            {activeSOS.status === 'ACCEPTED' ? 'MENGARAH KE TITIK DARURAT' : 
             activeSOS.status === 'ARRIVED_AT_SCENE' ? 'TELAH TIBA DI LOKASI' : 'MENGANTAR MENUJU RUMAH SAKIT'}
          </h2>
          <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'white', borderRadius: '12px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 700 }}>Pasien: {activeSOS.patientName}</p>
            <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b' }}>Jenis: {activeSOS.emergencyType}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ flex: 1, padding: '10px', backgroundColor: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}><Phone size={14} /> Hubungi Warga</button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            {activeSOS.status === 'ACCEPTED' && (
              <button onClick={() => updateSOSStatus('ARRIVED_AT_SCENE')} style={{ width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Konfirmasi Tiba di TKP</button>
            )}
            {activeSOS.status === 'ARRIVED_AT_SCENE' && (
              <button onClick={() => updateSOSStatus('EN_ROUTE_TO_HOSPITAL')} style={{ width: '100%', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Mengantar Ke Rumah Sakit</button>
            )}
            {activeSOS.status === 'EN_ROUTE_TO_HOSPITAL' && (
              <button onClick={() => resetSOS()} style={{ width: '100%', padding: '14px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Tugas Selesai (Kembali Standby)</button>
            )}
            <button onClick={resetSOS} style={{ width: '100%', padding: '14px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '12px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>Batalkan Paksa Tugas</button>
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

      {/* Status Selector */}
      <div>
        <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#334155' }}>Update Status Kendaraan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {renderStatusButton('Stand By', 'STANDBY', '#10b981', '#ecfdf5')}
          {renderStatusButton('Offline', 'OFFLINE', '#64748b', '#f1f5f9')}
          {renderStatusButton('On Response', 'ON_RESPONSE', '#f59e0b', '#fffbeb')}
          {renderStatusButton('On Duty', 'ON_DUTY', '#3b82f6', '#eff6ff')}
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

    </div>
  );
}
