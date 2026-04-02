import { useState } from 'react';
import { MessageCircle, User, ChevronRight, Search, ChevronLeft, Send } from 'lucide-react';

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'driver', text: 'Baik Pak, segera meluncur.', time: '16:12' },
    { id: 2, sender: 'user', text: 'Terima kasih Pak Supardi, saya tunggu.', time: '16:14' },
  ]);
  const [input, setInput] = useState('');

  const mockChats = [
    { id: 1, name: 'Supardi (Supir)', lastMsg: 'Terima kasih Pak Supardi, saya tunggu.', time: '16:14', status: 'online', unread: 0 },
    { id: 2, name: 'Ujang (Supir)', lastMsg: 'Terima kasih, Pak Ahmad.', time: 'Kemarin', status: 'offline', unread: 2 },
  ];

  const handleSendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), sender: 'user', text: input, time: 'Baru saja' }]);
    setInput('');
  };

  if (selectedChat) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f1f5f9' }}>
        {/* Chat Header */}
        <div style={{ padding: '16px', backgroundColor: 'var(--primary-red)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 10 }}>
          <button onClick={() => setSelectedChat(null)} style={{ background: 'none', border: 'none', color: 'white', padding: '4px' }}>
            <ChevronLeft size={24} />
          </button>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '15px' }}>{selectedChat.name}</h4>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>{selectedChat.status === 'online' ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {/* Message List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              style={{ 
                maxWidth: '80%', 
                padding: '12px', 
                borderRadius: '16px', 
                fontSize: '14px',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.sender === 'user' ? 'var(--primary-red)' : 'white',
                color: msg.sender === 'user' ? 'white' : 'var(--text-main)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '16px',
                borderBottomLeftRadius: msg.sender === 'driver' ? '2px' : '16px',
              }}
            >
              {msg.text}
              <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px', textAlign: 'right' }}>{msg.time}</div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div style={{ padding: '16px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <input 
            type="text" 
            placeholder="Ketik pesan..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc' }}
          />
          <button 
            onClick={handleSendMessage}
            style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'var(--primary-red)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.1s' }}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '90px', backgroundColor: '#f8fafc' }}>
      <div style={{ padding: '24px', backgroundColor: 'var(--primary-red)', color: 'white' }}>
        <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageCircle size={24} /> Pesan & Obrolan
        </h1>
        <p style={{ margin: '8px 0 0 0', fontSize: '13px', opacity: 0.9 }}>
          Koordinasi langsung dengan supir ambulans yang bertugas.
        </p>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="input-base" 
            placeholder="Cari percakapan..." 
            style={{ paddingLeft: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mockChats.map((chat) => (
            <div 
              key={chat.id} 
              className="card" 
              style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', position: 'relative' }}
              onClick={() => setSelectedChat(chat)}
            >
              <div style={{ position: 'relative' }}>
                <div style={{ width: '54px', height: '54px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={28} color="#64748b" />
                </div>
                <div style={{ 
                  position: 'absolute', bottom: '2px', right: '2px', width: '12px', height: '12px', 
                  borderRadius: '50%', backgroundColor: chat.status === 'online' ? '#10b981' : '#cbd5e1', 
                  border: '2px solid white' 
                }} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: '15px' }}>{chat.name}</h4>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{chat.time}</span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: chat.unread > 0 ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: chat.unread > 0 ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                  {chat.lastMsg}
                </p>
              </div>

              {chat.unread > 0 && (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-red)', color: 'white', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {chat.unread}
                </div>
              )}
              
              <ChevronRight size={20} color="#cbd5e1" style={{ marginLeft: chat.unread > 0 ? '0' : 'auto' }} />
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', padding: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MessageCircle size={32} color="#cbd5e1" />
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
            Hanya percakapan aktif <br /> yang akan ditampilkan di sini.
          </p>
        </div>
      </div>
    </div>
  );
}
