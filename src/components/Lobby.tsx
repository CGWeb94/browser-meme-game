import { useState } from 'react';
import { useGame } from '../context/GameContext';
import PlayerList from './PlayerList';

function CodeDisplay({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex items-center justify-center gap-2">
      <span className="text-sm text-gray-400">Code:</span>
      <div className="flex items-center gap-1">
        <span className={`text-2xl font-mono font-bold tracking-[0.3em] px-4 py-1 rounded-lg select-all transition-all ${
          revealed ? 'text-green-400 bg-green-900/30' : 'text-gray-600 bg-gray-800'
        }`}>
          {revealed ? code : '••••••'}
        </span>
        <button
          onClick={() => setRevealed(!revealed)}
          className="px-2 py-1 hover:bg-green-900/30 rounded-lg transition-colors text-gray-400 hover:text-green-400"
          title={revealed ? 'Code verstecken (für Streamer)' : 'Code anzeigen'}
        >
          {revealed ? '👁️' : '🔒'}
        </button>
      </div>
    </div>
  );
}

export default function Lobby() {
  const { state, send, dispatch } = useGame();
  const { lobbyId, isHost, players, settings } = state;

  const handleStart = () => {
    send('startGame', { lobbyId: lobbyId! });
  };

  const handleLeave = () => {
    send('leaveLobby', { lobbyId: lobbyId! });
    dispatch({ type: 'RESET' });
  };

  const updateSetting = (key: string, value: any) => {
    send('hostSettings', { lobbyId: lobbyId!, settings: { [key]: value } });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at center, #2d6a4a 0%, #0f2d1a 100%)' }}>
      <div className="card-container max-w-lg w-full space-y-6 animate-slide-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Lobby</h2>
          <CodeDisplay code={lobbyId || ''} />
          <p className="text-xs text-gray-500">Code für Streamer versteckbar 🔒</p>
        </div>

        {/* Player list */}
        <PlayerList players={players} hostId={state.hostId} currentPlayerId={state.playerId} />

        {/* Settings (host only) */}
        {isHost && (
          <div className="space-y-4 border-t border-gray-800 pt-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Einstellungen</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Runden</label>
                <select
                  className="input-field text-sm"
                  value={settings.totalRounds}
                  onChange={e => updateSetting('totalRounds', parseInt(e.target.value))}
                >
                  {[3, 5, 7, 10, 15].map(n => (
                    <option key={n} value={n}>{n} Runden</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Kartensatz</label>
                <select
                  className="input-field text-sm"
                  value={settings.cardSetSize}
                  onChange={e => updateSetting('cardSetSize', parseInt(e.target.value))}
                >
                  {[30, 60, 90, 120, 150, 200].map(n => (
                    <option key={n} value={n}>{n} Karten</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Rundentexte</label>
              <select
                className="input-field text-sm"
                value={settings.sentenceMode}
                onChange={e => updateSetting('sentenceMode', e.target.value)}
              >
                <option value="random">Zufällige Sätze</option>
                <option value="player_generated">Spieler schreiben Sätze</option>
              </select>
            </div>

            {settings.sentenceMode === 'player_generated' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sätze pro Spieler</label>
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
        )}

        {/* Settings display (non-host) */}
        {!isHost && (
          <div className="border-t border-gray-800 pt-4 text-sm text-gray-400 space-y-1">
            <p>{settings.totalRounds} Runden &middot; {settings.cardSetSize} Karten</p>
            <p>Modus: {settings.sentenceMode === 'random' ? 'Zufällige Sätze' : 'Spieler-Sätze'}</p>
            <p className="text-xs text-gray-600">Warte auf den Host...</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-secondary flex-1" onClick={handleLeave}>
            Verlassen
          </button>
          {isHost && (
            <button
              className="btn-primary flex-1"
              onClick={handleStart}
              disabled={players.filter(p => p.connected).length < 2}
            >
              Spiel starten {players.filter(p => p.connected).length < 2 && `(${players.filter(p => p.connected).length}/2)`}
            </button>
          )}
        </div>

        {state.error && (
          <div className="bg-red-900/30 border border-red-800 rounded-xl p-3 text-red-400 text-sm text-center">
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
}
