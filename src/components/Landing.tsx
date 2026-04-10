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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-container max-w-md w-full space-y-8 animate-slide-up">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-6xl">🃏</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Meme Card Game
          </h1>
          <p className="text-gray-500 text-sm">Das ultimative Meme-Kartenspiel</p>
        </div>

        {/* Connection status */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full ${state.connected ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
          <span className={state.connected ? 'text-green-400' : 'text-red-400'}>
            {state.connected ? 'Verbunden' : 'Verbinde...'}
          </span>
        </div>

        {/* Name input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Dein Name</label>
          <input
            className="input-field"
            placeholder="Name eingeben..."
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={20}
            onKeyDown={e => e.key === 'Enter' && mode === 'menu' && handleCreate()}
          />
        </div>

        {mode === 'menu' ? (
          <div className="space-y-3">
            <button
              className="btn-primary w-full text-lg"
              onClick={handleCreate}
              disabled={!state.connected || !name.trim()}
            >
              Lobby erstellen
            </button>
            <button
              className="btn-secondary w-full"
              onClick={() => setMode('join')}
              disabled={!state.connected || !name.trim()}
            >
              Lobby beitreten
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Lobby-Code</label>
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
            <button
              className="btn-primary w-full"
              onClick={handleJoin}
              disabled={!state.connected || !name.trim() || lobbyCode.length < 6}
            >
              Beitreten
            </button>
            <button
              className="btn-secondary w-full"
              onClick={() => setMode('menu')}
            >
              Zurück
            </button>
          </div>
        )}

        {/* Error */}
        {state.error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm text-center">
            {state.error}
            <button
              className="block mx-auto mt-2 text-xs text-red-500 underline"
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
