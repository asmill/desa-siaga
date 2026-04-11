import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import Layout from './components/Layout';
import RoleGuard from './components/RoleGuard';
import Home from './pages/Home';
import Radar from './pages/Radar';
import Booking from './pages/Booking';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import DriverDashboard from './pages/driver/DriverDashboard';
import { useStore } from './store/useStore';
import { AlertCircle, CheckCircle } from 'lucide-react';

function ToastContainer() {
  const { notification } = useStore();
  if (!notification || !notification.show) return null;
  
  return (
    <div style={{
      position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
      backgroundColor: notification.type === 'error' ? '#ef4444' : notification.type === 'success' ? '#10b981' : '#3b82f6',
      color: 'white', padding: '16px 24px', borderRadius: '12px', zIndex: 99999,
      display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      minWidth: '300px', fontWeight: 600, fontSize: '14px'
    }}>
       {notification.type === 'error' ? <AlertCircle size={20}/> : <CheckCircle size={20}/>}
       {notification.message}
    </div>
  )
}

function App() {
  const { isDarkMode } = useStore();

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  useEffect(() => {
    // Init OneSignal untuk push notifications saat app tertutup
    OneSignal.init({
      appId: "f48de674-ea17-4e38-b10f-a2808fcae5f8",
      allowLocalhostAsSecureOrigin: true
    }).catch(console.error);

    // Daftar Service Worker untuk notifikasi latar belakang Android
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/OneSignalSDKWorker.js', { scope: '/' })
        .then(reg => console.log('[SW] Registered, scope:', reg.scope))
        .catch(err => console.warn('[SW] Registration failed:', err));
    }
    
    // Minta izin notifikasi
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Register />} />
        <Route path="/setup-profile" element={<ProfileSetup />} />
        
        {/* Admin and PEMDES routes */}
        <Route path="/admin" element={
          <RoleGuard allowedRoles={['Admin', 'PEMDES', 'DPMD']}>
            <AdminDashboard />
          </RoleGuard>
        } />
        <Route path="/admin/users" element={
          <RoleGuard allowedRoles={['Admin', 'PEMDES']}>
            <AdminUsers />
          </RoleGuard>
        } />
        
        {/* App routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={
            <RoleGuard allowedRoles={['Masyarakat', 'Mitra']}>
              <Home />
            </RoleGuard>
          } />
          
          <Route path="driver" element={
            <RoleGuard allowedRoles={['Supir']}>
              <DriverDashboard />
            </RoleGuard>
          } />

          <Route path="radar" element={
            <RoleGuard allowedRoles={['Masyarakat', 'Supir', 'Relawan', 'Mitra']}>
              <Radar />
            </RoleGuard>
          } />
          <Route path="jadwal" element={
            <RoleGuard allowedRoles={['Masyarakat']}>
              <Booking />
            </RoleGuard>
          } />
          <Route path="pesan" element={
            <RoleGuard allowedRoles={['Masyarakat', 'Supir', 'Relawan', 'Mitra', 'PEMDES', 'DPMD']}>
              <Messages />
            </RoleGuard>
          } />
          <Route path="profil" element={
            <RoleGuard allowedRoles={['Masyarakat', 'Relawan', 'Mitra', 'Supir']}>
              <Profile />
            </RoleGuard>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
