import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, ShieldAlert, Clock, ChevronLeft } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Messages() {
  const { activeSOS, userProfile, chatMessages, chatHistory, sendChatMessage, fetchChatMessages, resetUnreadChat } = useStore();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [viewingHistorySosId, setViewingHistorySosId] = useState<string | null>(null);
  const [newChatPopup, setNewChatPopup] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(chatMessages.length);

  // Reset badge unread saat halaman dibuka
  useEffect(() => { resetUnreadChat(); }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // In-app popup saat pesan baru dari pihak lain
  useEffect(() => {
    const curr = chatMessages.length;
    if (curr > prevCountRef.current) {
      const newMsg = chatMessages[curr - 1];
      if (newMsg?.sender_id !== userProfile?.id) {
        setNewChatPopup(`${newMsg?.sender_name || 'Tim Darurat'}: "${newMsg?.message}"`);
        setTimeout(() => setNewChatPopup(null), 4000);
      }
    }
    prevCountRef.current = curr;
  }, [chatMessages, userProfile?.id]);

  useEffect(() => {
    if (activeSOS?.id) fetchChatMessages(activeSOS.id);
  }, [activeSOS?.id]);

  const handleSend = async () => {
    if (!input.trim() || !activeSOS) return;
    setSending(true);
    await sendChatMessage(input.trim());
    setInput('');
    setSending(false);
  };

  const formatTime = (ts: string) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const formatDate = (ts: string) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); }
    catch { return ts; }
  };

  // --- View: Melihat Riwayat Chat Spesifik ---
  if (viewingHistorySosId && chatHistory[viewingHistorySosId]) {
    const histMsgs = chatHistory[viewingHistorySosId];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f1f5f9' }}>
        <div style={{ padding: '16px', background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setViewingHistorySosId(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
            <ChevronLeft size={24} />
          </button>
          <Clock size={20} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Riwayat Percakapan</div>
            <div style={{ fontSize: '11px', opacity: 0.75 }}>{histMsgs.length} pesan</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {histMsgs.map((msg: any, idx: number) => {
            const isMe = msg.sender_id === userProfile?.id;
            return (
              <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', marginLeft: '4px', fontWeight: 600 }}>{msg.sender_name}</span>}
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '16px', fontSize: '14px', backgroundColor: isMe ? '#94a3b8' : 'white', color: isMe ? 'white' : '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: !isMe ? '4px' : '16px' }}>
                  {msg.message}
                  <div style={{ fontSize: '10px', opacity: 0.65, marginTop: '4px', textAlign: 'right' }}>{formatTime(msg.created_at)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- View: Tidak Ada SOS Aktif – Tampilkan Daftar Riwayat ---
  if (!activeSOS?.id) {
    const historyEntries = Object.entries(chatHistory);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: '90px', backgroundColor: '#f8fafc' }}>
        <div style={{ padding: '24px', backgroundColor: 'var(--primary-red)', color: 'white' }}>
          <h1 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageCircle size={24} /> Saluran Koordinasi Darurat
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.9 }}>
            Chat aktif selama penanganan SOS. Riwayat tersimpan di bawah.
          </p>
        </div>

        {historyEntries.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '16px', color: '#94a3b8', textAlign: 'center' }}>
            <ShieldAlert size={56} strokeWidth={1.5} />
            <h3 style={{ margin: 0, color: '#475569' }}>Tidak Ada Kejadian Darurat Aktif</h3>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
              Saluran percakapan ini aktif selama ada SOS. Riwayat chat dari SOS sebelumnya akan tampil di sini.
            </p>
          </div>
        ) : (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: 600 }}>RIWAYAT PERCAKAPAN DARURAT</p>
            {historyEntries.map(([sosId, msgs]: [string, any[]]) => {
              const last = msgs[msgs.length - 1];
              return (
                <button key={sosId} onClick={() => setViewingHistorySosId(sosId)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={20} color="#ef4444" />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Kejadian Darurat ({msgs.length} pesan)</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {last?.sender_name}: {last?.message}
                    </div>
                    {last?.created_at && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{formatDate(last.created_at)}</div>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- View: SOS Aktif – Chat Langsung ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f1f5f9' }}>
      
      {/* In-App Popup */}
      {newChatPopup && (
        <div style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '12px', zIndex: 99999, maxWidth: '90vw', fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', gap: '10px', animation: 'slideDown 0.3s ease-out' }}>
          <MessageCircle size={18} color="#10b981" />
          {newChatPopup}
        </div>
      )}

      {/* Chat Header */}
      <div style={{ padding: '16px', background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Darurat: {activeSOS.emergencyType}</h4>
          <span style={{ fontSize: '11px', opacity: 0.75 }}>Pasien: {activeSOS.patientName} · Status: {activeSOS.status}</span>
        </div>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 0 3px rgba(16,185,129,0.3)', animation: 'pulse 1.5s infinite' }} />
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {chatMessages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '40px', fontSize: '13px' }}>
            <MessageCircle size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
            <p>Belum ada pesan. Mulailah koordinasi.</p>
          </div>
        ) : (
          chatMessages.map((msg: any, idx: number) => {
            const isMe = msg.sender_id === userProfile?.id;
            return (
              <div key={msg.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                {!isMe && <span style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px', marginLeft: '4px', fontWeight: 600 }}>{msg.sender_name || 'Tim Darurat'}</span>}
                <div style={{ maxWidth: '80%', padding: '10px 14px', borderRadius: '16px', fontSize: '14px', lineHeight: 1.5, backgroundColor: isMe ? '#ef4444' : 'white', color: isMe ? 'white' : '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderBottomRightRadius: isMe ? '4px' : '16px', borderBottomLeftRadius: !isMe ? '4px' : '16px' }}>
                  {msg.message}
                  <div style={{ fontSize: '10px', opacity: 0.65, marginTop: '4px', textAlign: 'right' }}>{formatTime(msg.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px', alignItems: 'center', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <input type="text" placeholder="Ketik koordinasi Anda..." value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} style={{ flex: 1, padding: '12px 16px', borderRadius: '24px', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#f8fafc', fontSize: '14px' }} />
        <button onClick={handleSend} disabled={sending || !input.trim()} style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: sending || !input.trim() ? '#cbd5e1' : '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
