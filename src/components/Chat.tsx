import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

// Chat TTS reads incoming messages (not own) using the Web Speech API directly,
// without cancel() so it queues after any currently speaking round text.
function speakChatMessage(text: string, volume: number, voiceName: string): void {
  if (!window.speechSynthesis) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'de-DE';
  utter.rate = 1.0;
  utter.volume = volume;
  if (voiceName) {
    const voice = window.speechSynthesis.getVoices().find(v => v.name === voiceName);
    if (voice) utter.voice = voice;
  }
  window.speechSynthesis.speak(utter); // queues, does not cancel current speech
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { state, send } = useGame();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chatTtsMuted, setChatTtsMuted] = useState(
    () => localStorage.getItem('chat-tts-muted') === 'true'
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(state.chatMessages.length);

  // TTS for incoming messages (not own)
  useEffect(() => {
    const newMessages = state.chatMessages.slice(prevLengthRef.current);
    prevLengthRef.current = state.chatMessages.length;

    if (newMessages.length === 0) return;

    // Unread badge
    if (!open) {
      setUnreadCount(c => c + newMessages.length);
    }

    // Speak new messages that aren't from ourselves
    if (!chatTtsMuted && localStorage.getItem('tts-muted') !== 'true') {
      for (const msg of newMessages) {
        if (msg.playerId === state.playerId) continue;
        const volume = parseFloat(localStorage.getItem('tts-volume') ?? '1');
        const voiceName = localStorage.getItem('tts-voice') ?? '';
        speakChatMessage(`${msg.playerName}: ${msg.text}`, volume, voiceName);
      }
    }
  }, [state.chatMessages]);

  // Clear unread when panel opens
  useEffect(() => {
    if (open) setUnreadCount(0);
  }, [open]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [state.chatMessages, open]);

  const toggleChatTts = () => {
    const next = !chatTtsMuted;
    setChatTtsMuted(next);
    localStorage.setItem('chat-tts-muted', String(next));
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !state.lobbyId) return;
    send('sendChatMessage', { lobbyId: state.lobbyId, text });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't render on landing screen
  if (state.screen === 'landing') return null;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <>
          {/* Backdrop (mobile: tap outside closes) */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              zIndex: 39,
              background: 'transparent',
            }}
          />

          <div
            style={{
              position: 'fixed',
              bottom: 'calc(1.5rem + 3.5rem + 0.75rem)',
              right: '1.5rem',
              zIndex: 40,
              width: 'clamp(280px, 90vw, 380px)',
              height: 'clamp(300px, 50vh, 480px)',
              background: 'rgba(10,25,18,0.97)',
              border: '1px solid rgba(212,160,32,0.3)',
              borderRadius: '1rem',
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#d4a020', letterSpacing: '0.05em' }}>
                CHAT
              </span>
              <button
                onClick={toggleChatTts}
                title={chatTtsMuted ? 'Chat-Ton einschalten' : 'Chat-Ton ausschalten'}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.1rem', lineHeight: 1, padding: '0.2rem',
                  opacity: chatTtsMuted ? 0.4 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {chatTtsMuted ? '🔇' : '🔊'}
              </button>
            </div>

            {/* Message list */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}>
              {state.chatMessages.length === 0 && (
                <div style={{
                  textAlign: 'center', color: 'rgba(255,255,255,0.25)',
                  fontSize: '0.8rem', marginTop: '2rem',
                }}>
                  Noch keine Nachrichten
                </div>
              )}
              {state.chatMessages.map((msg, i) => {
                const isOwn = msg.playerId === state.playerId;
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {!isOwn && (
                      <span style={{
                        fontSize: '0.7rem', fontWeight: '700',
                        color: '#d4a020', marginBottom: '0.15rem',
                        marginLeft: '0.35rem',
                      }}>
                        {msg.playerName}
                      </span>
                    )}
                    <div style={{
                      maxWidth: '85%',
                      padding: '0.45rem 0.7rem',
                      borderRadius: isOwn ? '0.75rem 0.75rem 0.15rem 0.75rem' : '0.75rem 0.75rem 0.75rem 0.15rem',
                      background: isOwn ? 'rgba(212,160,32,0.18)' : 'rgba(255,255,255,0.07)',
                      border: isOwn ? '1px solid rgba(212,160,32,0.3)' : '1px solid rgba(255,255,255,0.1)',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}>
                      <span style={{ fontSize: '0.875rem', color: '#fff', lineHeight: 1.4 }}>
                        {msg.text}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)',
                      marginTop: '0.1rem',
                      marginLeft: isOwn ? 0 : '0.35rem',
                      marginRight: isOwn ? '0.35rem' : 0,
                    }}>
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input row */}
            <div style={{
              padding: '0.5rem 0.75rem',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              gap: '0.5rem',
              flexShrink: 0,
            }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={300}
                placeholder="Nachricht..."
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '0.5rem',
                  padding: '0.5rem 0.65rem',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  background: input.trim() ? 'linear-gradient(135deg, #d4a020, #9a7010)' : 'rgba(40,40,40,0.8)',
                  color: input.trim() ? '#1a0f00' : 'rgba(255,255,255,0.2)',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s',
                  flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
          </div>
        </>
      )}

      {/* Toggle button — fixed bottom-right */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Chat öffnen / schließen"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 40,
          width: '3.5rem',
          height: '3.5rem',
          borderRadius: '50%',
          background: open
            ? 'linear-gradient(145deg, rgba(212,160,32,0.9), rgba(150,110,20,0.9))'
            : 'linear-gradient(145deg, rgba(30,60,45,0.97), rgba(15,35,25,0.98))',
          border: `2px solid ${open ? 'rgba(212,160,32,0.8)' : 'rgba(212,160,32,0.4)'}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.4rem',
          transition: 'all 0.2s ease',
        }}
      >
        💬
        {/* Unread badge */}
        {unreadCount > 0 && !open && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            minWidth: '1.2rem',
            height: '1.2rem',
            borderRadius: '9999px',
            background: '#ef4444',
            border: '2px solid rgba(10,25,18,0.9)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 0.2rem',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
