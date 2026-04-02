import { useState, useEffect } from 'react';
import { Search, UserPlus, Trash2, CheckCircle, XCircle, Menu, Clock, Loader2 } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { getProvinces, getRegencies, getDistricts, getVillages } from '../../services/regionService';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../../services/supabaseClient';
import { useStore } from '../../store/useStore';

interface MockUser {
  id: string;
  name: string;
  role: string;
  status: string;
  phone: string;
}

export default function AdminUsers() {
  const { role: currentUserRole } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<MockUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  // Form State for Add User
  const [formData, setFormData] = useState({
    ktp: '',
    fullName: '',
    gender: '',
    phone: '',
    role: currentUserRole === 'Admin' ? 'PEMDES' : 'Relawan',
    province: '', provinceId: '',
    regency: '', regencyId: '',
    district: '', districtId: '',
    village: '', villageId: '',
    address: '',
    rt: '',
    rw: '',
    lat: -6.200000,
    lng: 106.816666
  });

  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data.map(u => ({
        id: u.id,
        name: u.full_name || 'Tanpa Nama',
        role: u.role || 'Masyarakat',
        status: u.is_verified ? 'Verified' : 'Pending',
        phone: u.phone
      })));
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (showAddModal) {
      getProvinces().then(setProvinces);
    }
  }, [showAddModal]);

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

  const LocationPicker = () => {
    useMapEvents({
      click(e) {
        setFormData({ ...formData, lat: e.latlng.lat, lng: e.latlng.lng });
      },
    });
    return <Marker position={[formData.lat, formData.lng]} />;
  };

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="admin-main">
        {/* Mobile Header */}
        <div className="admin-mobile-header">
          <button 
            onClick={() => setSidebarOpen(true)}
            style={{ 
              background: '#f1f5f9', border: 'none', cursor: 'pointer', 
              padding: '10px', borderRadius: '10px', color: '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Menu size={22} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--primary-red)', borderRadius: '50%' }}></div>
            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '16px', letterSpacing: '-0.5px' }}>DesaSiaga</span>
          </div>
          <div style={{ width: '42px' }}></div>
        </div>

        <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>Manajemen User</h1>
            <p style={{ color: '#64748b', margin: '4px 0 0 0', fontSize: '15px' }}>Kelola akses dan otoritas seluruh pengguna sistem.</p>
          </div>
          <button 
            onClick={() => { setShowAddModal(true); }}
            className="btn btn-primary" 
            style={{ 
              display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 24px', 
              borderRadius: '12px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' 
            }}
          >
            <UserPlus size={20} /> <span style={{ fontSize: '14px', fontWeight: 700 }}>Tambah Petugas</span>
          </button>
        </header>

        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', backgroundColor: '#ffffff' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Cari nama, email, atau role..." 
                className="input-base"
                style={{ paddingLeft: '40px', borderRadius: '10px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Nama Pengguna</th>
                  <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Peran (Role)</th>
                  <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Kontak</th>
                  <th style={{ textAlign: 'left', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '16px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={5} style={{textAlign: 'center', padding: '20px'}}>Memuat Data...</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                        backgroundColor: 
                          user.role === 'Admin' ? '#fef2f2' : 
                          user.role === 'PEMDES' ? '#ede9fe' : 
                          user.role === 'DPMD' ? '#ecfdf5' : 
                          user.role === 'Mitra' ? '#eff6ff' : 
                          user.role === 'Relawan' ? '#fff7ed' : 
                          user.role === 'Supir Ambulan' ? '#fefce8' : '#f8fafc',
                        color: 
                          user.role === 'Admin' ? '#dc2626' : 
                          user.role === 'PEMDES' ? '#6d28d9' : 
                          user.role === 'DPMD' ? '#059669' : 
                          user.role === 'Mitra' ? '#1d4ed8' : 
                          user.role === 'Relawan' ? '#c2410c' : 
                          user.role === 'Supir Ambulan' ? '#a16207' : '#64748b'
                      }}>{user.role}</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748b' }}>{user.phone}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: user.status === 'Verified' ? '#059669' : '#64748b' }}>
                        {user.status === 'Verified' ? <CheckCircle size={14} /> : <Clock size={14} />}
                        {user.status}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button style={{ padding: '8px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', cursor: 'pointer', color: '#dc2626' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Tambah User (Lengkap Aligned dengan Register) - Single Step Compact */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '850px', maxHeight: '95vh', backgroundColor: 'white', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>Tambah Pengguna Baru</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Lengkapi data identitas, domisili, dan akses akun secara lengkap.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}><XCircle size={28} color="#cbd5e1" /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Row 1: Identitas & Akun (High Priority) */}
              <div className="grid-2" style={{ gap: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--primary-red)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Informasi Identitas</h4>
                  <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Nomor KTP (NIK)</label>
                      <input type="number" className="input-base" placeholder="16 Digit NIK" style={{ borderRadius: '10px' }} value={formData.ktp} onChange={e => setFormData({...formData, ktp: e.target.value})} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Nama Lengkap</label>
                      <input type="text" className="input-base" placeholder="Sesuai KTP" style={{ borderRadius: '10px' }} value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Jenis Kelamin</label>
                      <select className="input-base" style={{ borderRadius: '10px' }} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                        <option value="">Pilih</option>
                        <option value="L">Laki-laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>No. HP / WhatsApp</label>
                      <input type="tel" className="input-base" placeholder="0812..." style={{ borderRadius: '10px' }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                </div>

                <div className="modal-account-auth" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '32px', borderLeft: '1px solid #f1f5f9' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Otoritas & Akun</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Role Akses</label>
                    <select className="input-base" style={{ borderRadius: '10px', fontWeight: 600 }} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      {currentUserRole === 'Admin' && (
                        <>
                          <option value="DPMD">DPMD</option>
                          <option value="PEMDES">PEMDES</option>
                        </>
                      )}
                      {(currentUserRole === 'PEMDES' || currentUserRole === 'Admin') && (
                        <>
                          <option value="Mitra">Mitra</option>
                          <option value="Relawan">Relawan</option>
                          <option value="Supir">Supir Ambulan</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginTop: '8px' }}>
                      Hanya akun {currentUserRole} yang diizinkan untuk membuat akun dengan peranan di atas. Warga yang mendaftar sendiri otomatis diregistrasi sebagai "Masyarakat".
                    </p>
                  </div>
                </div>
              </div>

              {/* Row 2: Alamat/Wilayah (Full Width Grid) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '32px', borderTop: '1px solid #f1f5f9' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wilayah & Domisili</h4>
                <div className="grid-4">
                  <select className="input-base" style={{ borderRadius: '10px' }} onChange={(e) => handleProvinceChange(e.target.value, e.target.options[e.target.selectedIndex].text)}>
                    <option value="">Provinsi</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select className="input-base" style={{ borderRadius: '10px' }} disabled={!regencies.length} onChange={(e) => handleRegencyChange(e.target.value, e.target.options[e.target.selectedIndex].text)}>
                    <option value="">Kabupaten</option>
                    {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <select className="input-base" style={{ borderRadius: '10px' }} disabled={!districts.length} onChange={(e) => handleDistrictChange(e.target.value, e.target.options[e.target.selectedIndex].text)}>
                    <option value="">Kecamatan</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select className="input-base" style={{ borderRadius: '10px' }} disabled={!villages.length} onChange={(e) => setFormData({...formData, village: e.target.options[e.target.selectedIndex].text, villageId: e.target.value})}>
                    <option value="">Desa</option>
                    {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                
                <div className="grid-address-detail" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1.2fr) 100px 100px', gap: '12px' }}>
                  <input type="text" className="input-base" placeholder="Alamat Lengkap (Dusun/Jalan)" style={{ borderRadius: '10px' }} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  <input type="text" className="input-base" placeholder="RT" style={{ borderRadius: '10px' }} value={formData.rt} onChange={e => setFormData({...formData, rt: e.target.value})} />
                  <input type="text" className="input-base" placeholder="RW" style={{ borderRadius: '10px' }} value={formData.rw} onChange={e => setFormData({...formData, rw: e.target.value})} />
                </div>

                <div className="location-grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
                  <div style={{ height: '240px', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                    <MapContainer center={[formData.lat, formData.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker />
                    </MapContainer>
                  </div>
                  <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                    <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700 }}>Penentuan Lokasi GPS</h5>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                      Ketuk peta untuk menandai titik koordinat rumah atau kantor petugas. Informasi ini sangat penting untuk akurasi respon darurat.
                    </p>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Latitude</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{formData.lat.toFixed(6)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Longitude</div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>{formData.lng.toFixed(6)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 32px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '16px', backgroundColor: '#f8fafc' }}>
              <button onClick={() => setShowAddModal(false)} className="btn" style={{ flex: 1, backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', fontWeight: 600 }}>Batalkan</button>
              <button disabled={savingUser} onClick={async () => { 
                setSavingUser(true);
                const payload = {
                  phone: formData.phone,
                  full_name: formData.fullName,
                  ktp: formData.ktp,
                  gender: formData.gender,
                  address: formData.address,
                  dusun: formData.village,
                  rt: formData.rt,
                  rw: formData.rw,
                  lat: formData.lat,
                  lng: formData.lng,
                  role: formData.role,
                  is_verified: true
                };

                const { error } = await supabase.from('profiles').insert(payload);
                setSavingUser(false);

                if (error) {
                  alert('Gagal menyimpa: ' + error.message);
                } else {
                  setShowAddModal(false); 
                  fetchUsers();
                  alert('Akun pengguna berhasil didaftarkan ke sistem. Mereka bisa login via OTP (123456).'); 
                }
              }} className="btn btn-primary" style={{ flex: 2, padding: '14px', fontWeight: 800 }}>
                {savingUser ? <Loader2 className="animate-spin" /> : 'Simpan & Daftarkan Pengguna'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
