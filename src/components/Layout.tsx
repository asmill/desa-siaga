import { useStore } from '../store/useStore';
import BottomNav from './BottomNav';
import { Outlet, useLocation, Navigate } from 'react-router-dom';

export default function Layout() {
  const { role, userProfile } = useStore();
  const location = useLocation();
  const isHomeOrDriver = location.pathname === '/' || location.pathname === '/driver';

  if (!userProfile) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      {isHomeOrDriver && (
        <div className="top-bar">
          <div className="user-greeting">
            <span className="text-subtitle">{role === 'Supir' ? 'Selamat Siaga,' : 'Selamat Datang,'}</span>
            <span className="text-title" style={{ fontSize: '20px' }}>{role === 'Supir' ? 'Supir Ambulans' : userProfile.full_name.split(' ')[0]}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '4px 12px', backgroundColor: role === 'Supir' ? '#eff6ff' : '#d1fae5', color: role === 'Supir' ? '#2563eb' : '#047857', borderRadius: '9999px', fontSize: '11px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
              Sync: Aktif
            </div>
            <div style={{ padding: '4px 12px', backgroundColor: role === 'Supir' ? '#eff6ff' : '#d1fae5', color: role === 'Supir' ? '#2563eb' : '#047857', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold' }}>
              {role === 'Supir' ? 'Unit 01' : 'RT 02'}
            </div>
          </div>
        </div>
      )}
      
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
