import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Phone, Lock, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useStore, type UserRole } from '../store/useStore';

export default function Register() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUserProfile, setRole, setIsVerified } = useStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 9) {
      alert('Masukkan nomor handphone yang valid');
      return;
    }
    if (password.length < 6) {
      alert('Masukkan sandi minimal 6 karakter');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error || !data) {
        // Akun belum ada (Warga baru) - jika masuk menggunakan sandi dummy 123456
        if (password === '123456') {
          alert('Akun Anda belum terdaftar. Silakan lengkapi profil.');
          navigate('/setup-profile', { state: { phone } });
        } else {
          alert('Akun tidak ditemukan dan Kata sandi OTP salah.');
        }
      } else {
        // Akun ditemukan
        const isMatched = (data.password && data.password === password) || (!data.password && password === '123456');

        if (isMatched) {
          setUserProfile({ id: data.id, phone: data.phone, full_name: data.full_name });
          setRole((data.role as UserRole) || 'Masyarakat');
          setIsVerified(data.is_verified || false);
          
          alert(`Selamat datang, ${data.full_name}!`);

          // Rutekan ke dashboard sesuai peran
          if (data.role === 'Admin' || data.role === 'PEMDES' || data.role === 'DPMD') navigate('/admin');
          else if (data.role === 'Supir') navigate('/driver');
          else navigate('/');
        } else {
          alert('Kata sandi salah!');
          setPassword('');
        }
      }
    } catch (err: any) {
        console.error('Error fetching profile', err);
        alert('Gagal mengecek data login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', minHeight: '100vh', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#fef2f2', color: 'var(--primary-red)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' 
        }}>
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-title" style={{ fontSize: '28px', color: 'var(--primary-red)' }}>DesaSiaga</h1>
        <p className="text-subtitle" style={{ marginTop: '8px' }}>Sistem Lapor Cepat & Bantuan Medis Darurat Desa dengan respons Real-Time.</p>
      </div>

      <div className="card" style={{ textAlign: 'center', backgroundColor: '#f8fafc', border: '1px dashed var(--border-color)', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Silakan masuk Sistem DesaSiaga. <br />Warga: <strong>123456</strong> | Petugas: <strong>12345678</strong>
        </p>
      </div>

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }}>
            <Phone size={20} />
          </div>
          <input 
            type="tel" 
            placeholder="081234567890" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ 
              width: '100%', height: '56px', borderRadius: '12px', border: '2px solid var(--border-color)', 
              padding: '0 16px 0 48px', fontSize: '16px', color: 'var(--text-main)', outline: 'none'
            }}
          />
        </div>
        
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }}>
            <Lock size={20} />
          </div>
          <input 
            type="password" 
            placeholder="Sandi Akses (OTP / PIN)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', height: '56px', borderRadius: '12px', border: '2px solid var(--border-color)', 
              padding: '0 16px 0 48px', fontSize: '16px', color: 'var(--text-main)', outline: 'none'
            }}
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="btn btn-primary" 
          style={{ width: '100%', height: '56px', fontSize: '16px', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Masuk / Daftar'}
        </button>
      </form>
    </div>
  );
}
