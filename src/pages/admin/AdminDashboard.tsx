import { useState } from 'react';
import { Activity, Timer, MapPin, ArrowUpRight, ArrowDownRight, Menu } from 'lucide-react';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    { label: 'Kejadian Darurat', value: '142', changeText: '+12 Kasus bulan ini', changeType: 'increase', icon: <Activity size={24} />, color: '#dc2626' },
    { label: 'Waktu Respon Rata-rata', value: '4.2 Mnt', changeText: 'Lebih cepat 30 dtk', changeType: 'positive', icon: <Timer size={24} />, color: '#2563eb' },
    { label: 'Area Rawan', value: 'Karangsari', changeText: 'Total 32 peringatan', changeType: 'neutral', icon: <MapPin size={24} />, color: '#f59e0b' },
  ];

  const recentLogs = [
    { id: 1, type: 'SOS', user: 'Ibu Ratna', time: '10:45', status: 'Selesai', driver: 'Supardi' },
    { id: 2, type: 'SOS', user: 'Bapak Ahmad', time: '11:20', status: 'Meluncur', driver: 'Mulyadi' },
    { id: 3, type: 'Booking', user: 'Siti Aminah', time: 'Besok, 08:00', status: 'Menunggu', driver: '-' },
  ];

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
          <div style={{ width: '42px' }}></div> {/* Spacer for balance */}
        </div>

        <header style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>Dashboard Ringkasan</h1>
              <p style={{ color: '#64748b', margin: '6px 0 0 0', fontSize: '15px' }}>Pantau kesehatan dan keamanan desa secara real-time.</p>
            </div>
          </div>
        </header>

        <div className="admin-stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', margin: '0 0 12px 0' }}>{stat.label}</p>
                <h3 style={{ fontSize: '32px', fontWeight: 800, margin: 0 }}>{stat.value}</h3>
                <div style={{ 
                  marginTop: '12px', fontSize: '12px', fontWeight: 700, 
                  color: stat.changeType === 'positive' || stat.changeType === 'increase' ? '#059669' : stat.changeType === 'neutral' ? '#64748b' : '#dc2626',
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  {stat.changeText} {(stat.changeType === 'increase' || stat.changeType === 'positive') ? <ArrowUpRight size={14} /> : stat.changeType === 'decrease' ? <ArrowDownRight size={14} /> : null}
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: `${stat.color}15`, color: stat.color, borderRadius: '12px' }}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '0' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Log Aktivitas Terbaru</h3>
            <button style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Lihat Semua</button>
          </div>
          <div className="admin-table-container">
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Tipe</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Warga</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Waktu</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Supir</th>
                  <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                        backgroundColor: log.type === 'SOS' ? '#fef2f2' : '#eff6ff',
                        color: log.type === 'SOS' ? '#dc2626' : '#2563eb'
                      }}>{log.type}</span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: 500 }}>{log.user}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: '#64748b' }}>{log.time}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{log.driver}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{ 
                        fontSize: '13px', fontWeight: 500,
                        color: log.status === 'Selesai' ? '#059669' : log.status === 'Meluncur' ? '#dc2626' : '#f59e0b'
                      }}>● {log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
