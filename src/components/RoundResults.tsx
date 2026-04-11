import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';

export default function RoundResults() {
  const { state, send } = useGame();

  const handleNextRound = () => {
    send('nextRound', { lobbyId: state.lobbyId! });
  };

  const isLastRound = state.roundNumber >= state.totalRounds;
  const winner = state.roundResults[0];

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6"
      style={{
        background:
          'radial-gradient(ellipse at center, #2d6a4a 0%, #1a3d2a 60%, #0f2218 100%)',
      }}
    >
      {/* Vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Title */}
      <h2 className="relative z-10 text-3xl font-black text-white mt-4 mb-6 animate-slide-up">
        Runde {state.roundNumber} Ergebnis
      </h2>

      {/* Winner card — large with gold glow */}
      {winner && (
        <div
          className="relative z-10 rounded-2xl overflow-hidden mb-7 animate-slide-up"
          style={{
            boxShadow: '0 0 0 3px #d4a020, 0 0 45px rgba(212, 160, 32, 0.55)',
            animationDelay: '50ms',
          }}
        >
          <MemeCard imageIndex={winner.imageIndex} size="lg" disabled />
        </div>
      )}

      {/* Scoreboard table */}
      <div
        className="relative z-10 w-full max-w-xl animate-slide-up"
        style={{ animationDelay: '100ms' }}
      >
        {/* Table header */}
        <div
          className="grid px-5 py-2.5 rounded-t-2xl text-xs font-bold uppercase tracking-widest text-gray-400"
          style={{
            gridTemplateColumns: '1fr auto auto',
            gap: '1rem',
            background: 'rgba(0,0,0,0.55)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span>Spieler</span>
          <span className="text-center w-28">Stimmen</span>
          <span className="text-right w-16">Punkte</span>
        </div>

        {/* Rows */}
        <div className="rounded-b-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)' }}>
          {state.roundResults.map((r, i) => (
            <div
              key={r.cardId}
              className="grid items-center px-5 py-3 animate-slide-up"
              style={{
                gridTemplateColumns: '1fr auto auto',
                gap: '1rem',
                borderBottom:
                  i < state.roundResults.length - 1
                    ? '1px solid rgba(255,255,255,0.06)'
                    : 'none',
                animationDelay: `${(i + 2) * 80}ms`,
              }}
            >
              {/* Player name + rank */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base w-6 text-center flex-shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className="font-semibold text-sm truncate">{r.playerName}</span>
                {r.playerName === state.players.find(p => p.id === state.hostId)?.name && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                    style={{ background: 'rgba(212,160,32,0.2)', color: '#d4a020' }}
                  >
                    Host
                  </span>
                )}
              </div>

              {/* Votes + card thumbnail */}
              <div className="flex items-center justify-center gap-2 w-28">
                <MemeCard imageIndex={r.imageIndex} size="sm" disabled />
                <span className="font-bold text-lg text-white">{r.votes}</span>
              </div>

              {/* Points earned */}
              <div
                className="text-right font-bold text-lg w-16"
                style={{ color: '#d4a020' }}
              >
                {r.pointsEarned}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nächste Runde / Host only */}
      <div
        className="relative z-10 w-full max-w-xl mt-5 flex justify-end animate-slide-up"
        style={{ animationDelay: '200ms' }}
      >
        {state.isHost && !isLastRound && (
          <div className="flex flex-col items-end gap-1">
            <button className="btn-green px-8" onClick={handleNextRound}>
              Nächste Runde →
            </button>
            <span className="text-xs text-gray-500">Nur für den Host sichtbar</span>
          </div>
        )}
        {!state.isHost && !isLastRound && (
          <p className="text-sm text-gray-500">Warte auf den Host...</p>
        )}
      </div>
    </div>
  );
}
