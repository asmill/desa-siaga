import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import './App.css';

function App() {
  return (
    <BrowserRouter>
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
            <RoleGuard allowedRoles={['Masyarakat']}>
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
