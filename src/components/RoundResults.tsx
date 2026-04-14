import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';
import { useIsMobile } from '../hooks/useIsMobile';

export default function RoundResults() {
  const { state, send } = useGame();
  const isMobile = useIsMobile();

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
          className="relative z-10 rounded-2xl overflow-hidden mb-5 animate-slide-up"
          style={{
            boxShadow: '0 0 0 3px #d4a020, 0 0 45px rgba(212, 160, 32, 0.55)',
            animationDelay: '50ms',
          }}
        >
          <MemeCard imageIndex={winner.imageIndex} size={isMobile ? 'md' : 'lg'} disabled />
        </div>
      )}

      {/* Scoreboard table */}
      <div
        className="relative z-10 w-full max-w-xl animate-slide-up"
        style={{ animationDelay: '100ms', padding: isMobile ? '0 0.5rem' : '0' }}
      >
        {/* Table header */}
        <div
          className="grid rounded-t-2xl text-xs font-bold uppercase tracking-widest text-gray-400"
          style={{
            gridTemplateColumns: '1fr auto auto',
            gap: isMobile ? '0.5rem' : '1rem',
            padding: isMobile ? '0.6rem 0.75rem' : '0.625rem 1.25rem',
            background: 'rgba(0,0,0,0.55)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span>Spieler</span>
          <span className="text-center" style={{ width: isMobile ? '4rem' : '7rem' }}>Stimmen</span>
          <span className="text-right" style={{ width: isMobile ? '3rem' : '4rem' }}>Punkte</span>
        </div>

        {/* Rows */}
        <div className="rounded-b-2xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)' }}>
          {state.roundResults.map((r, i) => (
            <div
              key={r.cardId}
              className="grid items-center animate-slide-up"
              style={{
                gridTemplateColumns: '1fr auto auto',
                gap: isMobile ? '0.5rem' : '1rem',
                padding: isMobile ? '0.6rem 0.75rem' : '0.75rem 1.25rem',
                borderBottom:
                  i < state.roundResults.length - 1
                    ? '1px solid rgba(255,255,255,0.06)'
                    : 'none',
                animationDelay: `${(i + 2) * 80}ms`,
              }}
            >
              {/* Player name + rank */}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base w-5 text-center flex-shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className="font-semibold text-sm truncate">{r.playerName}</span>
                {!isMobile && r.playerName === state.players.find(p => p.id === state.hostId)?.name && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-bold flex-shrink-0"
                    style={{ background: 'rgba(212,160,32,0.2)', color: '#d4a020' }}
                  >
                    Host
                  </span>
                )}
              </div>

              {/* Votes + card thumbnail */}
              <div
                className="flex items-center justify-center gap-1.5"
                style={{ width: isMobile ? '4rem' : '7rem' }}
              >
                {!isMobile && <MemeCard imageIndex={r.imageIndex} size="sm" disabled />}
                <span className="font-bold text-lg text-white">{r.votes}</span>
              </div>

              {/* Points earned */}
              <div
                className="text-right font-bold text-lg"
                style={{ color: '#d4a020', width: isMobile ? '3rem' : '4rem' }}
              >
                {r.pointsEarned}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Spacer so content isn't hidden behind fixed button on mobile */}
      {isMobile && !isLastRound && <div style={{ height: '80px' }} />}

      {/* Nächste Runde / Host only */}
      {isMobile ? (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20,
          padding: '0.75rem 1rem',
          background: 'linear-gradient(to top, rgba(10,24,16,0.98) 80%, transparent)',
        }}>
          {state.isHost && !isLastRound && (
            <>
              <button
                className="btn-green"
                style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                onClick={handleNextRound}
              >
                Nächste Runde →
              </button>
              <p className="text-center text-xs text-gray-500 mt-1">Nur für den Host sichtbar</p>
            </>
          )}
          {!state.isHost && !isLastRound && (
            <p className="text-center text-sm text-gray-500">Warte auf den Host...</p>
          )}
        </div>
      ) : (
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
      )}
    </div>
  );
}
