import { useEffect, useState } from 'react';
import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';
import { useIsMobile } from '../hooks/useIsMobile';
import { getCardImageSrc } from '../utils/memeImage';

export default function CardReveal() {
  const { state, send, dispatch } = useGame();
  const isMobile = useIsMobile();
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
  const memeSet = state.settings.memeSet ?? 'spongebob';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at center, #2d6a4a 0%, #1a3d2a 60%, #0f2218 100%)',
      }}
    >
      {/* Vignette */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }}
      />

      {/* Top info row */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '1rem 1.5rem 0',
        }}
      >
        <div>
          <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'rgba(255,255,255,0.9)' }}>
            Runde {state.roundNumber} / {state.totalRounds}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>
            Karten: {state.revealedCards.length}
          </div>
        </div>
        {state.votedCardId && (
          <div
            style={{
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              background: 'rgba(34,197,94,0.2)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#4ade80',
              fontSize: '0.8rem',
              fontWeight: '600',
            }}
          >
            Stimme abgegeben ✓
          </div>
        )}
      </div>

      {/* Round text */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', padding: '0.75rem 1.5rem 0' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '620px',
            background: 'rgba(0,0,0,0.62)',
            border: '1px solid rgba(212,160,32,0.45)',
            borderRadius: '1rem',
            padding: '1rem 2rem',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <p style={{ fontSize: '1.4rem', fontWeight: '700', color: '#fff', lineHeight: 1.4 }}>
            {state.roundText}
          </p>
        </div>
      </div>

      {/* Error */}
      {showError && state.error && (
        <div
          style={{
            position: 'relative',
            zIndex: 10,
            margin: '0.5rem 1.5rem 0',
            background: 'rgba(220,38,38,0.25)',
            border: '1px solid rgba(220,38,38,0.4)',
            borderRadius: '0.75rem',
            padding: '0.5rem 1rem',
            color: '#fca5a5',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          {state.error}
        </div>
      )}

      {/* ── Cards ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flex: 1,
          display: 'flex',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'center',
          padding: isMobile ? '0.75rem 1rem' : '1.25rem 1.5rem',
          overflowY: isMobile ? 'auto' : undefined,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : undefined,
            ...(isMobile ? { width: '100%', gap: '0.75rem' } : {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, auto)',
              gap: '1.5rem 1.25rem',
              justifyContent: 'center',
            }),
          }}
        >
          {state.revealedCards.map((rc, i) => {
            const isOwnCard = rc.cardId === state.selectedCardId;
            const canVote = !state.votedCardId && !isOwnCard;
            const hasVoted = state.votedCardId === rc.cardId;

            if (isMobile) {
              return (
                <div
                  key={rc.cardId}
                  style={{
                    width: '100%',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    border: hasVoted
                      ? '2px solid #d4a020'
                      : isOwnCard
                        ? '2px solid rgba(255,255,255,0.15)'
                        : '2px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    animation: `slideUp 0.35s ease-out ${i * 80}ms both`,
                  }}
                >
                  {/* Full-width image */}
                  <div style={{ position: 'relative', width: '100%', paddingBottom: '66.67%', background: '#1a3d2a' }}>
                    <img
                      src={getCardImageSrc(rc.imageIndex, memeSet)}
                      alt=""
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                    />
                    {/* Number badge */}
                    <div style={{
                      position: 'absolute', top: '8px', left: '8px',
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: '800', fontSize: '0.75rem', color: '#1a1a1a',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)', zIndex: 10,
                    }}>
                      {i + 1}
                    </div>
                    {hasVoted && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(212,160,32,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '3rem' }}>✓</span>
                      </div>
                    )}
                  </div>
                  {/* Action */}
                  {isOwnCard ? (
                    <div style={{ padding: '0.65rem 1rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                      Deine Karte
                    </div>
                  ) : (
                    <button
                      style={{
                        width: '100%', padding: '0.9rem',
                        fontWeight: '700', fontSize: '1rem', border: 'none',
                        cursor: state.votedCardId ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                        ...(hasVoted
                          ? { background: 'linear-gradient(135deg, #22c55e, #15803d)', color: '#fff' }
                          : state.votedCardId
                            ? { background: 'rgba(50,50,50,0.5)', color: 'rgba(255,255,255,0.25)' }
                            : { background: 'linear-gradient(135deg, #d4a020, #9a7010)', color: '#1a0f00' }
                        ),
                      }}
                      onClick={canVote ? () => handleVote(rc.cardId) : undefined}
                      disabled={!!state.votedCardId}
                    >
                      {hasVoted ? '✓ Gewählt' : 'Abstimmen'}
                    </button>
                  )}
                </div>
              );
            }

            // Desktop layout
            return (
              <div
                key={rc.cardId}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '0.5rem',
                  animation: `slideUp 0.35s ease-out ${i * 80}ms both`,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: '-8px', left: '-8px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '800', fontSize: '0.75rem', color: '#1a1a1a',
                    zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}>
                    {i + 1}
                  </div>
                  <MemeCard
                    imageIndex={rc.imageIndex}
                    size="xl"
                    selected={hasVoted}
                    disabled={!canVote}
                    onClick={canVote ? () => handleVote(rc.cardId) : undefined}
                  />
                </div>
                {isOwnCard ? (
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
                    Deine Karte
                  </span>
                ) : (
                  <button
                    style={{
                      width: '100%', padding: '0.55rem 1rem', borderRadius: '0.6rem',
                      fontWeight: '700', fontSize: '0.875rem', border: 'none',
                      cursor: state.votedCardId ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                      ...(hasVoted
                        ? { background: 'linear-gradient(135deg, #22c55e, #15803d)', color: '#fff' }
                        : state.votedCardId
                          ? { background: 'rgba(50,50,50,0.5)', color: 'rgba(255,255,255,0.25)' }
                          : { background: 'linear-gradient(135deg, #d4a020, #9a7010)', color: '#1a0f00' }
                      ),
                    }}
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

      {/* Progress bar — slim, bottom */}
      <div style={{ position: 'relative', zIndex: 10, padding: '0 1.5rem 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: '100%',
            maxWidth: '480px',
            height: '10px',
            borderRadius: '9999px',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #d4a020, #f0c040)',
              width: `${progressPct}%`,
              transition: 'width 0.5s ease',
            }}
          />
        </div>
        <p style={{ textAlign: 'center', marginTop: '0.4rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
          {state.playersReady}/{state.totalPlayers} Spieler haben abgestimmt
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
