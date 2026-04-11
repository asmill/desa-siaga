import { Home, Map as MapIcon, CalendarClock, User, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function BottomNav() {
  const { role, unreadChatCount } = useStore();
  const location = useLocation();
  const currentPath = location.pathname;

  const communityTabs = [
    { name: 'Beranda', icon: <Home size={24} />, path: '/' },
    { name: 'Radar', icon: <MapIcon size={24} />, path: '/radar' },
    { name: 'Jadwal', icon: <CalendarClock size={24} />, path: '/jadwal' },
    { name: 'Pesan', icon: <MessageCircle size={24} />, path: '/pesan', badge: unreadChatCount },
    { name: 'Profil', icon: <User size={24} />, path: '/profil' },
  ];

  const driverTabs = [
    { name: 'Beranda', icon: <Home size={24} />, path: '/driver' },
    { name: 'Radar', icon: <MapIcon size={24} />, path: '/radar' },
    { name: 'Pesan', icon: <MessageCircle size={24} />, path: '/pesan', badge: unreadChatCount },
    { name: 'Profil', icon: <User size={24} />, path: '/profil' },
  ];

  const mitraTabs = [
    { name: 'Beranda', icon: <Home size={24} />, path: '/' },
    { name: 'Radar', icon: <MapIcon size={24} />, path: '/radar' },
    { name: 'Profil', icon: <User size={24} />, path: '/profil' },
  ];

  let tabs = communityTabs;
  if (role === 'Supir') {
    tabs = driverTabs;
  } else if (role === 'Mitra' || role === 'Relawan' || role === 'PEMDES' || role === 'DPMD') {
    tabs = mitraTabs;
  }

  return (
    <nav className="bottom-nav">
      {tabs.map((tab: any) => {
        const isActive = currentPath === tab.path;
        return (
          <Link 
            key={tab.path} 
            to={tab.path} 
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="icon-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
              {tab.icon}
              {tab.badge > 0 && (
                <span style={{
                  position: 'absolute', top: '-6px', right: '-8px',
                  backgroundColor: '#ef4444', color: 'white',
                  borderRadius: '50%', width: '18px', height: '18px',
                  fontSize: '11px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid white'
                }}>
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </div>
            <span className="nav-label">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
