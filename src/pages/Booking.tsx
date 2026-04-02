import { useState } from 'react';
import { Calendar, MapPin, Activity, FileText, ChevronLeft, Navigation, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useStore } from '../store/useStore';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Haversine formula to calculate distance between two coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in km
  return d;
}

export default function Booking() {
  const { userCoords } = useStore();
  const [activeTab, setActiveTab] = useState<'pesan' | 'riwayat'>('pesan');
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    purpose: '',
    destName: '',
    destLat: 0,
    destLng: 0,
    ruteDistance: 0,
    ruteTime: 0,
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [tempDest, setTempDest] = useState<[number, number] | null>(null);

  const mockHistory = [
    { id: 1, date: '2026-03-24', time: '09:00', dest: 'RSUD Ciereng Subang', status: 'Selesai', purpose: 'Kontrol Kandungan' },
    { id: 2, date: '2026-03-26', time: '14:30', dest: 'Klinik Mata Sehat', status: 'Disetujui', purpose: 'Rawat Jalan' },
    { id: 3, date: '2026-03-28', time: '08:00', dest: 'Puskesmas Cikalong', status: 'Menunggu', purpose: 'Check-up rutin' },
  ];

  const MapPicker = () => {
    useMapEvents({
      click(e) {
        setTempDest([e.latlng.lat, e.latlng.lng]);
      },
    });
    return tempDest ? <Marker position={tempDest} /> : null;
  };

  const confirmDestination = () => {
    if (tempDest) {
      const dist = getDistance(userCoords[0], userCoords[1], tempDest[0], tempDest[1]);
      const time = Math.round((dist / 30) * 60 + 10); // 30km/h avg + 10m buffer
      
      let initialName = formData.destName;
      if (!initialName) {
        initialName = `Titik Peta (${tempDest[0].toFixed(3)}, ${tempDest[1].toFixed(3)})`;
      }
      
      setFormData({ 
        ...formData, 
        destName: initialName,
        destLat: tempDest[0], 
        destLng: tempDest[1],
        ruteDistance: Number(dist.toFixed(1)),
        ruteTime: time
      });
      setShowMapModal(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Berhasil! Permintaan peminjaman ambulans Anda telah dikirim ke PEMDES.');
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '90px', backgroundColor: '#f8fafc' }}>
      <div style={{ padding: '24px', backgroundColor: 'var(--primary-red)', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={24} /> Pesan Layanan Reguler
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
          Pesan ambulans untuk keperluan berobat berencana (Non-Darurat).
        </p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', backgroundColor: 'white', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => setActiveTab('pesan')} 
          style={{ flex: 1, padding: '16px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'pesan' ? '3px solid var(--primary-red)' : '3px solid transparent', color: activeTab === 'pesan' ? 'var(--primary-red)' : 'var(--text-muted)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Form Pemesanan
        </button>
        <button 
          onClick={() => setActiveTab('riwayat')} 
          style={{ flex: 1, padding: '16px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'riwayat' ? '3px solid var(--primary-red)' : '3px solid transparent', color: activeTab === 'riwayat' ? 'var(--primary-red)' : 'var(--text-muted)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Riwayat & Laporan
        </button>
      </div>

      <div style={{ padding: '24px' }}>
        {activeTab === 'pesan' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>1. Tanggal Pemakaian (Harian)</h2>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600 }}>Pilih Tanggal</label>
                <input 
                  type="date" 
                  required
                  className="input-base"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600 }}>Jam Pemakaian</label>
                <input 
                  type="time" 
                  required
                  className="input-base"
                  value={formData.time}
                  onChange={(e) => setFormData({...formData, time: e.target.value})}
                />
              </div>
            </div>
            <div style={{ backgroundColor: '#f1f5f9', padding: '12px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <i>Peminjaman reguler berlaku untuk penjemputan pada jam yang ditentukan.</i>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>2. Tujuan Fasilitas Kesehatan</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => { setTempDest(tempDest || userCoords); setShowMapModal(true); }}
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', 
                  padding: '16px', borderRadius: '12px', border: '1px dashed var(--primary-red)', 
                  backgroundColor: '#fff5f5', color: 'var(--primary-red)', fontWeight: 600, cursor: 'pointer' 
                }}
              >
                <MapPin size={20} />
                {formData.destLat === 0 ? 'Buka Peta & Pilih Tujuan' : 'Ubah Titik Tujuan di Peta'}
              </button>

              {formData.destLat !== 0 && (
                <>
                  <input 
                    type="text" 
                    placeholder="Nama RS/Klinik (Contoh: RSUD Subang)"
                    className="input-base"
                    required
                    value={formData.destName}
                    onChange={(e) => setFormData({...formData, destName: e.target.value})}
                  />
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <div style={{ flex: 1, backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#059669', marginBottom: '4px' }}>Est. Jarak</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#047857' }}>{formData.ruteDistance} KM</div>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: '#2563eb', marginBottom: '4px' }}>Est. Waktu (1x Jalan)</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1d4ed8' }}>~{formData.ruteTime} Menit</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: '16px', margin: 0, paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>3. Detail Keperluan</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>Keperluan Medis</label>
              <select 
                className="input-base" 
                required
                value={formData.purpose}
                onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              >
                <option value="">Pilih Keperluan</option>
                <option value="Kontrol Kandungan">Kontrol Kandungan / Melahirkan</option>
                <option value="Rawat Jalan">Rawat Jalan / Check-up</option>
                <option value="Jemput Pasien">Jemput Pasien Pulang</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>Catatan Tambahan (Opsional)</label>
              <textarea 
                placeholder="Misal: Pasien harus berbaring dan membawa tabung oksigen."
                className="input-base"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || formData.destLat === 0}
            style={{ height: '56px', fontSize: '16px', marginTop: '16px' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : <FileText size={20} />}
            Ajukan Pemesanan
          </button>
        </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mockHistory.map((item) => (
              <div key={item.id} className="card" style={{ padding: '16px', borderLeft: `4px solid ${item.status === 'Selesai' ? '#10b981' : item.status === 'Disetujui' ? '#2563eb' : '#f59e0b'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px' }}>{item.dest}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{item.purpose}</p>
                  </div>
                  <span style={{ 
                    fontSize: '10px', fontWeight: 700, padding: '4px 8px', borderRadius: '4px',
                    backgroundColor: item.status === 'Selesai' ? '#d1fae5' : item.status === 'Disetujui' ? '#dbeafe' : '#fef3c7',
                    color: item.status === 'Selesai' ? '#065f46' : item.status === 'Disetujui' ? '#1e40af' : '#92400e'
                  }}>
                    {item.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> {item.date}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={14} /> {item.time} WIB
                  </div>
                </div>
              </div>
            ))}
            <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
              Menampilkan 3 laporan terakhir.
            </p>
          </div>
        )}
      </div>

      {/* Map Picker Modal */}
      {showMapModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button onClick={() => setShowMapModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
              <ChevronLeft size={24} color="var(--text-main)" />
            </button>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Pilih Titik Tujuan</h3>
          </div>
          
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer center={tempDest || userCoords} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapPicker />
            </MapContainer>
            
            <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, zIndex: 1000 }}>
              <button 
                className="btn btn-primary" 
                onClick={confirmDestination}
                disabled={!tempDest}
                style={{ width: '100%', height: '56px', display: 'flex', gap: '8px', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}
              >
                <Navigation size={20} />
                Konfirmasi Lokasi Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
