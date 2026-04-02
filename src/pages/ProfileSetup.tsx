import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';
import { Camera, ChevronRight, ChevronLeft, Loader2, Navigation } from 'lucide-react';
import { getProvinces, getRegencies, getDistricts, getVillages } from '../services/regionService';
import imageCompression from 'browser-image-compression';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const statePhone = location.state?.phone || '';
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    ktp: '',
    fullName: '',
    gender: '',
    phone: statePhone,
    province: '', provinceId: '',
    regency: '', regencyId: '',
    district: '', districtId: '',
    village: '', villageId: '',
    address: '',
    dusun: '',
    rt: '',
    rw: '',
    lat: -6.200000,
    lng: 106.816666,
    photo: null as string | null
  });

  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.200000, 106.816666]);

  const LocationPicker = () => {
    const map = useMap();
    useMapEvents({
      click(e) {
        setFormData({ ...formData, lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });

    useEffect(() => {
      map.flyTo(mapCenter, map.getZoom());
    }, [mapCenter, map]);

    return formData.lat && formData.lng ? (
      <Marker position={[formData.lat, formData.lng]} />
    ) : null;
  };

  // Region List State
  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    getProvinces().then(setProvinces);
  }, []);

  const handleProvinceChange = async (id: string, name: string) => {
    setFormData({ ...formData, province: name, provinceId: id, regency: '', district: '', village: '' });
    const data = await getRegencies(id);
    setRegencies(data);
  };

  const handleRegencyChange = async (id: string, name: string) => {
    setFormData({ ...formData, regency: name, regencyId: id, district: '', village: '' });
    const data = await getDistricts(id);
    setDistricts(data);
  };

  const handleDistrictChange = async (id: string, name: string) => {
    setFormData({ ...formData, district: name, districtId: id, village: '' });
    const data = await getVillages(id);
    setVillages(data);
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const options = { maxSizeMB: 0.2, maxWidthOrHeight: 800, useWebWorker: true };
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => setFormData({ ...formData, photo: reader.result as string });
        reader.readAsDataURL(compressedFile);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const getLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormData({ ...formData, lat: latitude, lng: longitude });
        setMapCenter([latitude, longitude]);
        setLoading(false);
      },
      (_err) => {
        alert('Gagal mengambil lokasi. Pastikan GPS aktif.');
        setLoading(false);
      }
    );
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', minHeight: '100vh', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ flex: 1, height: '4px', backgroundColor: step >= 1 ? 'var(--primary-red)' : '#e2e8f0', borderRadius: '2px' }} />
        <div style={{ flex: 1, height: '4px', backgroundColor: step >= 2 ? 'var(--primary-red)' : '#e2e8f0', borderRadius: '2px' }} />
        <div style={{ flex: 1, height: '4px', backgroundColor: step >= 3 ? 'var(--primary-red)' : '#e2e8f0', borderRadius: '2px' }} />
      </div>

      {step === 1 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 className="text-title">Informasi Pribadi</h2>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>No. KTP (NIK)</label>
              <input 
                type="number" 
                placeholder="16 Digit NIK"
                className="input-base"
                value={formData.ktp}
                onChange={(e) => setFormData({...formData, ktp: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>Nama Lengkap</label>
              <input 
                type="text" 
                placeholder="Sesuai KTP"
                className="input-base"
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>Jenis Kelamin</label>
              <select 
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                value={formData.gender}
                onChange={(e) => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600 }}>No. Telepon / WhatsApp</label>
              <input 
                type="tel" 
                placeholder="081xxxx"
                className="input-base"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}
              />
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
          <h2 className="text-title">Foto Profil</h2>
          <div style={{ 
            width: '180px', height: '180px', borderRadius: '50%', backgroundColor: '#f1f5f9', 
            border: '4px solid white', boxShadow: '0 0 0 2px var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            position: 'relative'
          }}>
            {formData.photo ? (
              <img src={formData.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Camera size={48} color="#94a3b8" />
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
          </div>
          <p className="text-subtitle" style={{ textAlign: 'center' }}>Ketuk lingkaran untuk ambil foto atau pilih dari galeri. (Akan terkompres otomatis)</p>
        </section>
      )}

      {step === 3 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 className="text-title">Alamat & Lokasi</h2>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select onChange={(e) => handleProvinceChange(e.target.value, e.target.options[e.target.selectedIndex].text)} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <option value="">Pilih Provinsi</option>
              {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select onChange={(e) => handleRegencyChange(e.target.value, e.target.options[e.target.selectedIndex].text)} disabled={!regencies.length} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <option value="">Pilih Kabupaten</option>
              {regencies.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select onChange={(e) => handleDistrictChange(e.target.value, e.target.options[e.target.selectedIndex].text)} disabled={!districts.length} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <option value="">Pilih Kecamatan</option>
              {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select onChange={(e) => setFormData({...formData, village: e.target.options[e.target.selectedIndex].text, villageId: e.target.value})} disabled={!villages.length} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <option value="">Pilih Desa</option>
              {villages.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <input placeholder="Alamat Lengkap" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input placeholder="RT" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
              <input placeholder="RW" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
            </div>
            
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', height: '250px', position: 'relative', zIndex: 0 }}>
              <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker />
              </MapContainer>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>Ketuk peta untuk menyesuaikan titik rumah Anda.</p>
            
            <button 
              type="button" 
              onClick={getLocation} 
              style={{ padding: '16px', borderRadius: '12px', border: '1px dashed var(--primary-red)', backgroundColor: '#fff5f5', color: 'var(--primary-red)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Navigation size={20} />}
              Lacak Posisi Saat Ini
            </button>
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
              Lat: {formData.lat.toFixed(5)}, Lng: {formData.lng.toFixed(5)}
            </div>
          </div>
        </section>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px', background: 'white', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px', maxWidth: '480px', margin: '0 auto', zIndex: 10 }}>
        {step > 1 && (
          <button className="btn" onClick={() => setStep(step - 1)} style={{ backgroundColor: '#f1f5f9', color: 'var(--text-main)', flex: 1 }}>
            <ChevronLeft size={20} /> Kembali
          </button>
        )}
        <button 
          className="btn btn-primary" 
          disabled={loading}
          onClick={async () => {
            if (step === 3) {
              setLoading(true);
              const payload = {
                phone: formData.phone,
                full_name: formData.fullName,
                ktp: formData.ktp,
                gender: formData.gender,
                address: formData.address,
                dusun: formData.dusun,
                rt: formData.rt,
                rw: formData.rw,
                lat: formData.lat,
                lng: formData.lng,
                photo_url: formData.photo,
                role: 'Masyarakat',
                is_verified: true
              };

              const { data, error } = await supabase.from('profiles').insert(payload).select().single();
              setLoading(false);

              if (error) {
                alert('Gagal menyimpan profil: ' + error.message);
              } else {
                useStore.setState({ 
                  userProfile: { id: data.id, phone: data.phone, full_name: data.full_name },
                  role: 'Masyarakat',
                  isVerified: true
                });
                alert('Profil berhasil disimpan! Akun Anda sudah diverifikasi.');
                navigate('/');
              }
            } else {
              setStep(step + 1);
            }
          }} 
          style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
          {loading ? <Loader2 className="animate-spin" /> : step === 3 ? 'Simpan Profil' : 'Lanjut'} 
          {!loading && <ChevronRight size={20} />}
        </button>
      </div>
    </div>
  );
}
