import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';

export default function CardReveal() {
  const { state, send, dispatch } = useGame();
  const [showError, setShowError] = useState(false);

  const handleVote = (cardId: string) => {
    dispatch({ type: 'VOTE_CARD', cardId });
    send('vote', { lobbyId: state.lobbyId!, cardId });
  };

  useEffect(() => {
    if (state.error) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  const progressPct = state.totalPlayers
    ? (state.playersReady / state.totalPlayers) * 100
    : 0;

  return (
    <div
      className="min-h-screen flex flex-col"
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

      {/* Top info */}
      <div className="relative z-10 flex items-start justify-between px-6 pt-4">
        <div>
          <div className="text-sm font-bold text-gray-300">
            Runde {state.roundNumber} / {state.totalRounds}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Karten: {state.revealedCards.length}
          </div>
        </div>
        {state.votedCardId && (
          <div
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{
              background: 'rgba(34,197,94,0.2)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#4ade80',
            }}
          >
            Stimme abgegeben ✓
          </div>
        )}
      </div>

      {/* Round text */}
      <div className="relative z-10 flex justify-center mt-3 px-4">
        <div
          className="max-w-xl w-full rounded-2xl px-6 py-4 text-center"
          style={{
            background: 'rgba(0,0,0,0.58)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <p className="text-lg font-bold text-white leading-snug">{state.roundText}</p>
        </div>
      </div>

      {/* Error */}
      {showError && state.error && (
        <div
          className="relative z-10 mx-4 mt-3 rounded-xl p-2 text-center text-sm"
          style={{
            background: 'rgba(220,38,38,0.25)',
            border: '1px solid rgba(220,38,38,0.4)',
            color: '#fca5a5',
          }}
        >
          {state.error}
        </div>
      )}

      {/* Revealed cards grid */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-6">
        <div className="flex flex-wrap justify-center gap-6 max-w-3xl w-full">
          {state.revealedCards.map((rc, i) => {
            const isOwnCard = rc.cardId === state.selectedCardId;
            const canVote = !state.votedCardId && !isOwnCard;
            const hasVoted = state.votedCardId === rc.cardId;

            return (
              <div
                key={rc.cardId}
                className="flex flex-col items-center gap-3 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Card with number badge */}
                <div className="relative">
                  {/* Number badge */}
                  <div
                    className="absolute -top-3 -left-3 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold z-10 shadow-lg"
                    style={{
                      background: 'rgba(15,15,15,0.92)',
                      border: '2px solid rgba(212,160,32,0.65)',
                      color: '#d4a020',
                    }}
                  >
                    {i + 1}
                  </div>

                  <MemeCard
                    imageIndex={rc.imageIndex}
                    size="md"
                    selected={hasVoted}
                    disabled={!canVote}
                    onClick={canVote ? () => handleVote(rc.cardId) : undefined}
                  />
                </div>

                {/* Vote button / status */}
                {isOwnCard ? (
                  <span className="text-xs text-gray-500 italic">Deine Karte</span>
                ) : (
                  <button
                    className="px-5 py-1.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                    style={
                      hasVoted
                        ? {
                            background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                            color: '#fff',
                          }
                        : state.votedCardId
                          ? {
                              background: 'rgba(50,50,50,0.5)',
                              color: 'rgba(255,255,255,0.25)',
                              cursor: 'not-allowed',
                            }
                          : {
                              background: 'linear-gradient(135deg, #d4a020 0%, #9a7010 100%)',
                              color: '#1a0f00',
                              cursor: 'pointer',
                            }
                    }
                    onClick={canVote ? () => handleVote(rc.cardId) : undefined}
                    disabled={!!state.votedCardId}
                  >
                    {hasVoted ? '✓ Gewählt' : 'Abstimmen'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="relative z-10 px-6 pb-6">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          <span className="progress-label">
            {state.playersReady}/{state.totalPlayers} Spieler haben abgestimmt
          </span>
        </div>
      </div>
    </div>
  );
}
