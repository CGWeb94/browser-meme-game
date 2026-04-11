import { useState } from 'react';
import { useGame } from '../context/GameContext';

/** Amber-coloured person silhouette icon (SVG) */
function PersonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#c8a020"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function Landing() {
  const { state, dispatch, send } = useGame();
  const [name, setName] = useState(state.playerName);
  const [lobbyCode, setLobbyCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'join'>('menu');

  const handleCreate = () => {
    if (!name.trim()) return;
    dispatch({ type: 'SET_NAME', name: name.trim() });
    send('createLobby', { playerName: name.trim() });
  };

  const handleJoin = () => {
    if (!name.trim() || !lobbyCode.trim()) return;
    dispatch({ type: 'SET_NAME', name: name.trim() });
    send('joinLobby', { lobbyId: lobbyCode.trim().toUpperCase(), playerName: name.trim() });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: "url('/landing-bg.png') center/cover no-repeat, #0c0c0c",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
      }}
    >
      {/* Connection dot — tiny, top-right, barely visible */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 10 }}>
        <span
          title={state.connected ? 'Verbunden' : 'Verbinde...'}
          style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: state.connected ? '#4ade80' : '#f87171',
            display: 'inline-block',
            opacity: 0.6,
          }}
        />
      </div>

      {/* Content centered over the background */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '560px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontSize: 'clamp(3.5rem, 7vw, 6.5rem)',
            fontWeight: '900',
            color: '#ffffff',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            marginBottom: '3rem',
            textShadow: '0 4px 30px rgba(0,0,0,0.7)',
          }}
        >
          MEME POKER NIGHT
        </h1>

        {/* Form container */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Name input */}
          <div>
            <label
              style={{
                display: 'block',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.875rem',
                fontWeight: '600',
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                marginBottom: '0.5rem',
              }}
            >
              Spielername
            </label>
            <div style={{ position: 'relative' }}>
              <PersonIcon />
              <input
                className="input-field"
                style={{ paddingLeft: '2.75rem', fontSize: '1rem', padding: '0.9rem 1rem 0.9rem 2.75rem' }}
                placeholder="Ihr Name hier..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                onKeyDown={e => e.key === 'Enter' && mode === 'menu' && handleCreate()}
              />
            </div>
          </div>

          {/* Lobby code input — appears when joining */}
          {mode === 'join' && (
            <div>
              <label
                style={{
                  display: 'block',
                  color: 'rgba(255,255,255,0.75)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '0.4rem',
                }}
              >
                Lobby-Code
              </label>
              <input
                className="input-field"
                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'monospace' }}
                placeholder="ABC123"
                value={lobbyCode}
                onChange={e => setLobbyCode(e.target.value.toUpperCase())}
                maxLength={6}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                autoFocus
              />
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '0.875rem', marginTop: '0.25rem' }}>
            {mode === 'menu' ? (
              <>
                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '1.05rem', padding: '0.95rem 1rem', fontWeight: '700' }}
                  onClick={handleCreate}
                  disabled={!state.connected || !name.trim()}
                >
                  Lobby erstellen
                </button>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: '1.05rem', padding: '0.95rem 1rem', fontWeight: '700' }}
                  onClick={() => setMode('join')}
                  disabled={!state.connected || !name.trim()}
                >
                  Lobby beitreten
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: '1.05rem', padding: '0.95rem 1rem', fontWeight: '700' }}
                  onClick={() => setMode('menu')}
                >
                  Zurück
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, fontSize: '1.05rem', padding: '0.95rem 1rem', fontWeight: '700' }}
                  onClick={handleJoin}
                  disabled={!state.connected || !name.trim() || lobbyCode.length < 6}
                >
                  Beitreten
                </button>
              </>
            )}
          </div>

          {/* Error */}
          {state.error && (
            <div
              style={{
                background: 'rgba(220,38,38,0.2)',
                border: '1px solid rgba(220,38,38,0.45)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: '#fca5a5',
                fontSize: '0.875rem',
                textAlign: 'center',
                marginTop: '0.25rem',
              }}
            >
              {state.error}
              <button
                style={{ display: 'block', margin: '0.25rem auto 0', fontSize: '0.75rem', textDecoration: 'underline', opacity: 0.7, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}
                onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
              >
                Schließen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
