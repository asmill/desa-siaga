import { Home, Map as MapIcon, CalendarClock, User, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function BottomNav() {
  const { role } = useStore();
  const location = useLocation();
  const currentPath = location.pathname;

  const communityTabs = [
    { name: 'Beranda', icon: <Home size={24} />, path: '/' },
    { name: 'Radar', icon: <MapIcon size={24} />, path: '/radar' },
    { name: 'Jadwal', icon: <CalendarClock size={24} />, path: '/jadwal' },
    { name: 'Pesan', icon: <MessageCircle size={24} />, path: '/pesan' },
    { name: 'Profil', icon: <User size={24} />, path: '/profil' },
  ];

  const driverTabs = [
    { name: 'Beranda', icon: <Home size={24} />, path: '/driver' },
    { name: 'Radar', icon: <MapIcon size={24} />, path: '/radar' },
    { name: 'Pesan', icon: <MessageCircle size={24} />, path: '/pesan' },
    { name: 'Profil', icon: <User size={24} />, path: '/profil' },
  ];

  const tabs = role === 'Supir' ? driverTabs : communityTabs;

  return (
    <nav className="bottom-nav">
      {tabs.map((tab) => {
        const isActive = currentPath === tab.path;
        return (
          <Link 
            key={tab.path} 
            to={tab.path} 
            className={`nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="icon-wrapper">{tab.icon}</div>
            <span className="nav-label">{tab.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
