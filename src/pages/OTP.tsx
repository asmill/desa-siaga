import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, RefreshCcw, Lock } from 'lucide-react';
import '../App.css';
import { supabase } from '../services/supabaseClient';
import { useStore, type UserRole } from '../store/useStore';

export default function OTP() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const phone = location.state?.phone || '';
  const { setUserProfile, setRole, setIsVerified } = useStore();

  const handleVerify = async () => {
    if (password.length < 6) {
      alert('Masukkan kata sandi/OTP minimal 6 karakter');
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
          if (data.role === 'Admin') navigate('/admin');
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
    <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px', minHeight: '100vh', justifyContent: 'center', backgroundColor: 'var(--surface-color)' }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#d1fae5', color: '#059669', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
        }}>
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-title" style={{ fontSize: '24px' }}>Verifikasi Nomor HP</h1>
        <p className="text-subtitle" style={{ marginTop: '12px', lineHeight: '1.5' }}>
          Masukkan Sandi/OTP dari SMS akun <strong>{phone}</strong>. <br/>
          Warga (dummy): <strong>123456</strong> | Petugas (dummy): <strong>12345678</strong>
        </p>
      </div>

      <div style={{ padding: '0 8px' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: '16px', left: '16px', color: 'var(--text-muted)' }}>
            <Lock size={20} />
          </div>
          <input
            type="password"
            placeholder="Masukkan OTP atau Kata Sandi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%', height: '56px', fontSize: '16px', fontWeight: 600,
              borderRadius: '12px', border: '2px solid',
              borderColor: password ? 'var(--primary-red)' : 'var(--border-color)',
              backgroundColor: 'white', color: 'var(--text-main)',
              padding: '0 16px 0 48px', outline: 'none', transition: 'all 0.2s'
            }}
          />
        </div>
      </div>

      <button 
        onClick={handleVerify}
        disabled={loading}
        className="btn btn-primary" 
        style={{ width: '100%', height: '56px', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px' }}
      >
        {loading ? 'Memverifikasi...' : 'Verifikasi Akun'} {!loading && <ArrowRight size={20} />}
      </button>

      <div style={{ textAlign: 'center' }}>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          <RefreshCcw size={16} /> Kirim Ulang Kode
        </button>
      </div>
    </div>
  );
}
