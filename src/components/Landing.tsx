import { useState } from 'react';
import { useGame } from '../context/GameContext';

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
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#111111' }}
    >
      {/* Outer rounded panel with inset shadow */}
      <div
        className="w-full max-w-sm"
        style={{
          background: 'radial-gradient(ellipse at 35% 25%, #272727 0%, #1a1a1a 100%)',
          borderRadius: '2.5rem',
          padding: '3rem 2.5rem',
          boxShadow:
            'inset 0 1px 1px rgba(255,255,255,0.06), 0 30px 70px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Connection indicator */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                state.connected ? 'bg-green-400' : 'bg-red-400 animate-pulse'
              }`}
            />
            <span className={state.connected ? 'text-green-400' : 'text-red-400'}>
              {state.connected ? 'Online' : 'Verbinde...'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1
            className="font-black text-white tracking-tight"
            style={{ fontSize: '2.6rem', lineHeight: 1.1, textShadow: '0 2px 20px rgba(0,0,0,0.5)' }}
          >
            MEME POKER NIGHT
          </h1>
        </div>

        {/* Name input */}
        <div className="mb-4">
          <label className="block text-xs text-gray-400 mb-2 uppercase tracking-widest">
            Spielername
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-base">👤</span>
            <input
              className="input-field pl-9"
              placeholder="Ihr Name hier..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && mode === 'menu' && handleCreate()}
            />
          </div>
        </div>

        {/* Join code input (only in join mode) */}
        {mode === 'join' && (
          <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-2 uppercase tracking-widest">
              Lobby-Code
            </label>
            <input
              className="input-field text-center text-2xl tracking-[0.3em] uppercase font-mono"
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
        <div className="flex gap-3 mt-7">
          {mode === 'menu' ? (
            <>
              <button
                className="btn-primary flex-1"
                onClick={handleCreate}
                disabled={!state.connected || !name.trim()}
              >
                Lobby erstellen
              </button>
              <button
                className="btn-secondary flex-1"
                onClick={() => setMode('join')}
                disabled={!state.connected || !name.trim()}
              >
                Lobby beitreten
              </button>
            </>
          ) : (
            <>
              <button className="btn-secondary flex-1" onClick={() => setMode('menu')}>
                Zurück
              </button>
              <button
                className="btn-primary flex-1"
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
            className="mt-5 rounded-xl p-3 text-sm text-center"
            style={{
              background: 'rgba(220,38,38,0.2)',
              border: '1px solid rgba(220,38,38,0.4)',
              color: '#fca5a5',
            }}
          >
            {state.error}
            <button
              className="block mx-auto mt-1 text-xs underline opacity-70"
              onClick={() => dispatch({ type: 'CLEAR_ERROR' })}
            >
              Schließen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
