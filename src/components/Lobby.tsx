import { useState } from 'react';
import { useGame } from '../context/GameContext';

function getAvatarColor(name: string): string {
  const colors = ['#c0392b', '#2980b9', '#8e44ad', '#27ae60', '#e67e22', '#16a085', '#d35400', '#2c3e50'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function CodeDisplay({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
      style={{
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(212, 160, 32, 0.45)',
      }}
    >
      <span className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Lobby Code:</span>
      <span
        className="font-mono font-bold text-xl tracking-[0.2em]"
        style={{ color: '#d4a020' }}
      >
        {revealed ? code : '• • • • • •'}
      </span>
      <button
        onClick={() => setRevealed(!revealed)}
        className="text-gray-400 hover:text-white transition-colors text-base leading-none"
        title={revealed ? 'Code verstecken' : 'Code anzeigen'}
      >
        {revealed ? '👁️' : '🔒'}
      </button>
      <button
        onClick={handleCopy}
        className="text-gray-400 hover:text-white transition-colors text-base leading-none"
        title="Code kopieren"
      >
        {copied ? '✓' : '📋'}
      </button>
    </div>
  );
}

export default function Lobby() {
  const { state, send, dispatch } = useGame();
  const { lobbyId, isHost, players, settings } = state;

  const handleStart = () => send('startGame', { lobbyId: lobbyId! });
  const handleLeave = () => {
    send('leaveLobby', { lobbyId: lobbyId! });
    dispatch({ type: 'RESET' });
  };
  const updateSetting = (key: string, value: any) => {
    send('hostSettings', { lobbyId: lobbyId!, settings: { [key]: value } });
  };

  const connectedPlayers = players.filter(p => p.connected);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'radial-gradient(ellipse at center, #2d6a4a 0%, #1a3d2a 60%, #0f2218 100%)',
      }}
    >
      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)' }}
      />

      {/* Header */}
      <div className="relative z-10 flex justify-center pt-6 pb-2">
        <CodeDisplay code={lobbyId || ''} />
      </div>

      {/* Main panels */}
      <div className="relative z-10 flex-1 flex items-start justify-center gap-4 p-4 pt-4">
        {/* Players panel */}
        <div className="poker-panel flex-1 max-w-xs">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
            Players ({connectedPlayers.length}/{players.length})
          </h3>
          <ul className="space-y-2">
            {players.map(p => (
              <li
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                style={{
                  background:
                    p.id === state.playerId
                      ? 'rgba(212,160,32,0.1)'
                      : 'rgba(0,0,0,0.25)',
                  border:
                    p.id === state.playerId
                      ? '1px solid rgba(212,160,32,0.3)'
                      : '1px solid transparent',
                  opacity: p.connected ? 1 : 0.45,
                }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md"
                  style={{ background: getAvatarColor(p.name) }}
                >
                  {getInitials(p.name)}
                </div>

                {/* Name + host badge */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-sm truncate">{p.name}</span>
                    {p.id === state.hostId && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                        style={{ background: 'rgba(212,160,32,0.2)', color: '#d4a020' }}
                      >
                        ★ Host
                      </span>
                    )}
                  </div>
                </div>

                {/* Online status */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span
                    className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-400' : 'bg-gray-600'}`}
                  />
                  <span className="text-xs text-gray-400">{p.connected ? 'Online' : 'Offline'}</span>
                </div>
              </li>
            ))}
          </ul>

          {players.length < 3 && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Mindestens 3 Spieler benötigt
            </p>
          )}
        </div>

        {/* Settings panel */}
        <div className="poker-panel flex-1 max-w-xs">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
            Settings {!isHost && <span className="normal-case font-normal">(Host only)</span>}
          </h3>

          {isHost ? (
            <div className="space-y-5">
              {/* Rundenzahl slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-300">Rundenzahl</label>
                  <span className="font-bold text-sm" style={{ color: '#d4a020' }}>
                    {settings.totalRounds}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4 text-right">3</span>
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="1"
                    value={settings.totalRounds}
                    onChange={e => updateSetting('totalRounds', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-4">15</span>
                </div>
              </div>

              {/* Kartensatzgröße slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm text-gray-300">Kartensatzgröße</label>
                  <span className="font-bold text-sm" style={{ color: '#d4a020' }}>
                    {settings.cardSetSize}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-4 text-right">30</span>
                  <input
                    type="range"
                    min="30"
                    max="200"
                    step="10"
                    value={settings.cardSetSize}
                    onChange={e => updateSetting('cardSetSize', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-6">200</span>
                </div>
              </div>

              {/* Satzmodus */}
              <div>
                <label className="block text-sm text-gray-300 mb-2">Satzmodus</label>
                <select
                  className="input-field text-sm"
                  value={settings.sentenceMode}
                  onChange={e => updateSetting('sentenceMode', e.target.value)}
                >
                  <option value="random">Standard</option>
                  <option value="player_generated">Spieler schreiben Sätze</option>
                </select>
              </div>

              {settings.sentenceMode === 'player_generated' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Sätze pro Spieler</label>
                  <select
                    className="input-field text-sm"
                    value={settings.sentencesPerPlayer}
                    onChange={e => updateSetting('sentencesPerPlayer', parseInt(e.target.value))}
                  >
                    <option value={1}>1 Satz</option>
                    <option value={2}>2 Sätze</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-gray-400">Runden</span>
                <span className="font-bold" style={{ color: '#d4a020' }}>
                  {settings.totalRounds}
                </span>
              </div>
              <div className="flex justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="text-gray-400">Kartensatz</span>
                <span className="font-bold" style={{ color: '#d4a020' }}>
                  {settings.cardSetSize}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Modus</span>
                <span className="text-gray-300">
                  {settings.sentenceMode === 'random' ? 'Standard' : 'Spieler-Sätze'}
                </span>
              </div>
              <p className="text-xs text-gray-500 pt-2">Warte auf den Host...</p>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <div
          className="relative z-10 mx-4 mb-2 rounded-xl p-3 text-sm text-center"
          style={{
            background: 'rgba(220,38,38,0.2)',
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#fca5a5',
          }}
        >
          {state.error}
        </div>
      )}

      {/* Bottom buttons */}
      <div className="relative z-10 flex gap-4 p-5">
        <button className="btn-secondary px-8 flex-none" onClick={handleLeave}>
          Verlassen
        </button>
        {isHost && (
          <button
            className="btn-green flex-1"
            onClick={handleStart}
            disabled={connectedPlayers.length < 2}
          >
            ⚙️ Spiel starten
            {connectedPlayers.length < 2 && ` (${connectedPlayers.length}/2)`}
          </button>
        )}
        {!isHost && (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-sm text-gray-400">Warte auf den Host...</span>
          </div>
        )}
      </div>
    </div>
  );
}
