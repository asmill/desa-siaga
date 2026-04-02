import { useState, useEffect } from 'react';
import { User, ShieldCheck, ShieldAlert, Edit3, Ambulance, Loader2, Save } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase } from '../services/supabaseClient';

export default function Profile() {
  const { userProfile, role, isVerified, setUserProfile } = useStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [ambulances, setAmbulances] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    ktp: '', full_name: '', gender: 'L', phone: '',
    dusun: '', rt: '', rw: '', village: '', district: '', 
    regency: '', province: '', address: '', vehicle_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.phone) return;
      setLoading(true);
      try {
        // Fetch Profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('phone', userProfile.phone).single();
        if (profile) {
           setFormData({
             ktp: profile.ktp || '', full_name: profile.full_name || '', gender: profile.gender || 'L',
             phone: profile.phone || '', dusun: profile.dusun || '', rt: profile.rt || '',
             rw: profile.rw || '', village: profile.village || '', district: profile.district || '',
             regency: profile.regency || '', province: profile.province || '', address: profile.address || '',
             vehicle_id: '' 
           });
        }
        
        // Fetch Ambulances for Driver
        if (role === 'Supir') {
           const { data: amb } = await supabase.from('ambulances').select('*');
           if (amb) {
              setAmbulances(amb);
              // Find the one that currently has this driver_id
              const myAmb = amb.find(a => a.driver_id === profile?.id);
              if (myAmb) {
                 setFormData(prev => ({...prev, vehicle_id: myAmb.id}));
              }
           }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile, role]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update Profile
      const { error: profErr } = await supabase.from('profiles')
        .update({
          full_name: formData.full_name, ktp: formData.ktp, gender: formData.gender,
          dusun: formData.dusun, rt: formData.rt, rw: formData.rw, village: formData.village, 
          district: formData.district, regency: formData.regency, province: formData.province, address: formData.address
        })
        .eq('phone', userProfile?.phone);
      
      if (profErr) throw profErr;

      // 2. Update Ambulance assignment if driver
      if (role === 'Supir' && formData.vehicle_id) {
         // Clear previous driver if any
         await supabase.from('ambulances').update({ driver_id: null }).eq('driver_id', userProfile?.id);
         // Assign to new
         await supabase.from('ambulances').update({ driver_id: userProfile?.id }).eq('id', formData.vehicle_id);
      }

      setUserProfile({ ...userProfile, full_name: formData.full_name } as any);
      alert('Profil berhasil diperbarui!');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui profil');
    } finally {
      setSaving(false);
    }
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
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'white', border: '4px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {role === 'Supir' ? <Ambulance size={48} color="#2563eb" /> : <User size={48} color="var(--primary-red)" />}
          </div>
          {isVerified && (
            <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#10b981', borderRadius: '50%', padding: '4px', border: '2px solid white' }}>
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
        
        {/* Profile Info Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Informasi Akun</h3>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <button disabled={saving} onClick={handleSave} style={{ background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nama Lengkap</label>
              <input className="input-base" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={!isEditing} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Nomor Induk Kependudukan (KTP)</label>
              <input className="input-base" value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value})} disabled={!isEditing} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>RT</label>
                <input className="input-base" value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} disabled={!isEditing} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>RW</label>
                <input className="input-base" value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} disabled={!isEditing} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Dusun</label>
              <input className="input-base" value={formData.dusun} onChange={e => setFormData({...formData, dusun: e.target.value})} disabled={!isEditing} />
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Alamat Lengkap</label>
              <textarea className="input-base" rows={3} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={!isEditing} />
            </div>

            {role === 'Supir' && (
              <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px dashed #e2e8f0' }}>
                <label style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Ambulance size={16} /> Kendaraan Bertugas
                </label>
                <select 
                  className="input-base"
                  value={formData.vehicle_id}
                  onChange={e => setFormData({...formData, vehicle_id: e.target.value})}
                  disabled={!isEditing}
                  style={{ width: '100%', height: '50px' }}
                >
                  <option value="">-- Pilih Ambulan --</option>
                  {ambulances.map(amb => (
                    <option key={amb.id} value={amb.id}>{amb.vehicle_name} ({amb.plate_number})</option>
                  ))}
                </select>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>Hanya dikelola jika ditugaskan PEMDES.</p>
              </div>
            )}
          </div>
        </div>

        <button onClick={handleLogout} className="btn" style={{ width: '100%', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 700, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          Keluar (Log Out)
        </button>
      </div>
    </div>
  );
}
