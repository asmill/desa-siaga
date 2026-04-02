import { Users, ClipboardList, Activity, LayoutDashboard, ChevronLeft, ShieldCheck, Map } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate, useLocation } from 'react-router-dom';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const { setRole } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/admin' },
    { name: 'Manajemen User', icon: <Users size={20} />, path: '/admin/users' },
    { name: 'Log SOS', icon: <Activity size={20} />, path: '/admin/sos' },
    { name: 'Pesanan Ambulans', icon: <ClipboardList size={20} />, path: '/admin/bookings' },
    { name: 'Global Radar', icon: <Map size={20} />, path: '/admin/radar' },
  ];

  return (
    <>
      {/* Backdrop for Mobile */}
      <div 
        className={`admin-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
      />

      <div className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: '#fef2f2', borderRadius: '8px', color: 'var(--primary-red)' }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--primary-red)' }}>DesaSiaga</h2>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>ADMIN PANEL v2.2.0</span>
          </div>
        </div>

        <div style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  if (onClose) onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: isActive ? '#fef2f2' : 'transparent',
                  color: isActive ? 'var(--primary-red)' : '#64748b',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.2s'
                }}
              >
                {item.icon}
                <span style={{ fontSize: '14px' }}>{item.name}</span>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={() => {
              setRole('Masyarakat');
              navigate('/');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              width: '100%',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <ChevronLeft size={16} />
            Kembali ke Warga
          </button>
        </div>
      </div>
    </>
  );
}
