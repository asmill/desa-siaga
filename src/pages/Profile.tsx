import { useState, useEffect, useRef } from 'react';
import { User, ShieldCheck, ShieldAlert, Edit3, Ambulance, Loader2, Save, Camera, Moon, Sun } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';
import { getProvinces, getRegencies, getDistricts, getVillages } from '../services/regionService';

export default function Profile() {
  const { userProfile, role, isVerified, setUserProfile, showNotification, isDarkMode, setIsDarkMode } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    phone: '', full_name: '', ktp: '', gender: '',
    dusun: '', rt: '', rw: '', village: '', district: '', regency: '', province: '', address: '', vehicle_id: '',
    mitraCategory: '', provinceId: '', regencyId: '', districtId: '', villageId: ''
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile) return;
      setLoading(true);
      try {
      const { data } = await supabase.from('profiles').select('*').eq('phone', userProfile.phone).single();
      if (data) {
        let fData = {
          phone: data.phone || '', full_name: data.full_name || '', ktp: data.ktp || '', 
          gender: data.gender || '', dusun: data.dusun || '', rt: data.rt || '', 
          rw: data.rw || '', village: data.village || '', district: data.district || '', 
          regency: data.regency || '', province: data.province || '', address: data.address || '',
          mitraCategory: data.mitra_category || '',
          vehicle_id: '', provinceId: '', regencyId: '', districtId: '', villageId: ''
        };
        if (data.photo_url) setPhotoUrl(data.photo_url);
        
        if (role === 'Supir') {
          const { data: ambData } = await supabase.from('ambulances').select('*').eq('driver_id', data.id).single();
          if (ambData) fData.vehicle_id = ambData.id;
        }

        setFormData(fData);

        // Preload EMSIFA API Regions
        const provs = await getProvinces();
        setProvinces(provs);
        
        if (fData.province) {
           const pItem = provs.find((p: any) => p.name === fData.province);
           if (pItem) {
              fData.provinceId = pItem.id;
              const regs = await getRegencies(pItem.id);
              setRegencies(regs);
              
              const rItem = regs.find((r: any) => r.name === fData.regency);
              if (rItem) {
                 fData.regencyId = rItem.id;
                 const dists = await getDistricts(rItem.id);
                 setDistricts(dists);

                 const dItem = dists.find((d: any) => d.name === fData.district);
                 if (dItem) {
                    fData.districtId = dItem.id;
                    const vills = await getVillages(dItem.id);
                    setVillages(vills);
                    
                    const vItem = vills.find((v: any) => v.name === fData.village);
                    if (vItem) fData.villageId = vItem.id;
                 }
              }
           }
        }
        setFormData(fData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
    fetchData();
  }, [userProfile, role]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error: profErr } = await supabase.from('profiles')
        .update({
          full_name: formData.full_name, ktp: formData.ktp, gender: formData.gender,
          dusun: formData.dusun, rt: formData.rt, rw: formData.rw, village: formData.village, 
          district: formData.district, regency: formData.regency, province: formData.province, address: formData.address,
          mitra_category: role === 'Mitra' ? formData.mitraCategory : undefined
        })
        .eq('phone', userProfile?.phone);
      
      if (profErr) throw profErr;

      setUserProfile({ ...userProfile, full_name: formData.full_name, mitraCategory: formData.mitraCategory } as any);
      showNotification('Profil demografi berhasil diperbarui!', 'success');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      showNotification('Gagal memperbarui profil', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Ukuran foto maksimal 2MB', 'error');
      return;
    }
    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        setPhotoUrl(base64);
        await supabase.from('profiles').update({ photo_url: base64 }).eq('phone', userProfile?.phone);
        setUserProfile({ ...userProfile, photo_url: base64 } as any);
        showNotification('Foto profil berhasil diperbarui!', 'success');
        setTimeout(() => setUploadingPhoto(false), 300);
      };
      reader.readAsDataURL(file);
    } catch {
      showNotification('Gagal mengunggah foto', 'error');
      setUploadingPhoto(false);
    }
  };

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

  const handleLogout = () => {
    useStore.getState().setUserProfile(null);
    window.location.href = '/login';
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '80px', backgroundColor: '#f8fafc' }}>
      
      {/* Header Profile Info */}
      <div style={{ padding: '32px 24px 24px', backgroundColor: role === 'Supir' ? '#2563eb' : 'var(--primary-red)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Photo Avatar */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div
            onClick={() => photoInputRef.current?.click()}
            style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'white', border: '4px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              role === 'Supir' ? <Ambulance size={48} color="#2563eb" /> : <User size={48} color="var(--primary-red)" />
            )}
            {/* Upload overlay */}
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="photo-overlay">
              {uploadingPhoto ? <Loader2 size={24} color="white" className="animate-spin" /> : <Camera size={24} color="white" />}
            </div>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
          {/* Camera icon always visible at corner */}
          <div onClick={() => photoInputRef.current?.click()} style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '50%', padding: '4px', border: '2px solid white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {uploadingPhoto ? <Loader2 size={14} color="#475569" className="animate-spin" /> : <Camera size={14} color="#475569" />}
          </div>
          {isVerified && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, backgroundColor: '#10b981', borderRadius: '50%', padding: '4px', border: '2px solid white' }}>
              <ShieldCheck size={16} color="white" />
            </div>
          )}
        </div>
        
        <h2 style={{ margin: '0 0 4px 0', fontSize: '20px' }}>{formData.full_name}</h2>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>{role === 'Supir' ? `Telepon: ${formData.phone}` : `NIK: ${formData.ktp}`}</p>
        
        <div style={{ 
          marginTop: '16px', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.2)', border: '1px solid rgba(255, 255, 255, 0.3)', color: 'white'
        }}>
          {isVerified ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
          {role === 'Supir' ? 'Supir Siaga Puskesmas' : 'Warga Desa Terverifikasi'}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Toggle Dark Mode */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <div style={{ padding: '8px', backgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9', borderRadius: '10px' }}>
                {isDarkMode ? <Moon size={20} color="#38bdf8" /> : <Sun size={20} color="#f59e0b" />}
             </div>
             <div>
               <h3 style={{ margin: 0, fontSize: '15px' }}>Mode Tampilan</h3>
               <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{isDarkMode ? 'Gelap' : 'Terang'}</p>
             </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
             <input type="checkbox" checked={isDarkMode} onChange={(e) => setIsDarkMode(e.target.checked)} style={{ display: 'none' }} />
             <div style={{ width: '44px', height: '24px', backgroundColor: isDarkMode ? '#3b82f6' : '#cbd5e1', borderRadius: '12px', position: 'relative', transition: 'background-color 0.2s' }}>
                <div style={{ width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: isDarkMode ? '22px' : '2px', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
             </div>
          </label>
        </div>

        {/* Profile Info Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Informasi Akun</h3>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <button disabled={saving} onClick={handleSaveProfile} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Simpan
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nomor HP</label>
              <input className="input-base" value={formData.phone} disabled style={{ backgroundColor: '#f1f5f9', color: '#94a3b8' }} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Nama Lengkap</label>
              <input className="input-base" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={!isEditing} />
            </div>

            {role === 'Mitra' && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>Kategori Mitra / Instansi</label>
                <select className="input-base" value={formData.mitraCategory} onChange={e => setFormData({...formData, mitraCategory: e.target.value})} disabled={!isEditing} style={{ padding: '12px' }}>
                  <option value="">-- Pilih Satuan --</option>
                  <option value="Babinsa">TNI / Babinsa</option>
                  <option value="Kamtibmas">Polri / Bhabinkamtibmas</option>
                  <option value="Klinik">Klinik / Puskesmas</option>
                  <option value="Kader">Kader Desa Siaga</option>
                  <option value="Pemadam">Pemadam Kebakaran</option>
                  <option value="Bidan">Bidan Desa</option>
                  <option value="Linmas">LINMAS</option>
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nomor Induk Kependudukan (KTP)</label>
                <input className="input-base" value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value})} disabled={!isEditing} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Jenis Kelamin</label>
                <select className="input-base" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} disabled={!isEditing} style={{ padding: '12px' }}>
                  <option value="">Pilih</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Provinsi</label>
                {!isEditing ? (
                   <input className="input-base" value={formData.province} disabled />
                ) : (
                   <select className="input-base" style={{ padding: '12px' }} value={formData.provinceId} onChange={e => handleProvinceChange(e.target.value, e.target.options[e.target.selectedIndex].text)}>
                     <option value="">Pilih Provinsi</option>
                     {provinces.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Kabupaten</label>
                {!isEditing ? (
                   <input className="input-base" value={formData.regency} disabled />
                ) : (
                   <select className="input-base" style={{ padding: '12px' }} value={formData.regencyId} onChange={e => handleRegencyChange(e.target.value, e.target.options[e.target.selectedIndex].text)} disabled={!regencies.length}>
                     <option value="">Pilih Kabupaten</option>
                     {regencies.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                   </select>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Kecamatan</label>
                {!isEditing ? (
                   <input className="input-base" value={formData.district} disabled />
                ) : (
                   <select className="input-base" style={{ padding: '12px' }} value={formData.districtId} onChange={e => handleDistrictChange(e.target.value, e.target.options[e.target.selectedIndex].text)} disabled={!districts.length}>
                     <option value="">Pilih Kecamatan</option>
                     {districts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                   </select>
                )}
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Desa</label>
                {!isEditing ? (
                   <input className="input-base" value={formData.village} disabled />
                ) : (
                   <select className="input-base" style={{ padding: '12px' }} value={formData.villageId} onChange={e => setFormData({...formData, village: e.target.options[e.target.selectedIndex].text, villageId: e.target.value})} disabled={!villages.length}>
                     <option value="">Pilih Desa</option>
                     {villages.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}
                   </select>
                )}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>RT</label>
                <input className="input-base" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} disabled={!isEditing} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>RW</label>
                <input className="input-base" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} disabled={!isEditing} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Dusun</label>
                <input className="input-base" value={formData.dusun} onChange={e => setFormData({...formData, dusun: e.target.value})} disabled={!isEditing} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Alamat Lengkap</label>
              <textarea className="input-base" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={!isEditing} />
            </div>
          </div>
        </div>



        <button onClick={handleLogout} className="btn" style={{ width: '100%', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          Keluar (Log Out)
        </button>
      </div>
    </div>
  );
}
