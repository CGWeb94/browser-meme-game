import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';
import PlayerSeats from './PlayerSeats';

// Scattered card suits as background watermark
const WATERMARK_SUITS = [
  { suit: '♠', top: '8%',  left: '4%',   size: '5rem',  rotate: '-15deg', opacity: 0.06 },
  { suit: '♥', top: '12%', right: '5%',  size: '7rem',  rotate: '10deg',  opacity: 0.05 },
  { suit: '♦', top: '42%', left: '2%',   size: '4.5rem',rotate: '5deg',   opacity: 0.07 },
  { suit: '♣', top: '55%', right: '8%',  size: '6rem',  rotate: '-8deg',  opacity: 0.05 },
  { suit: '♠', top: '28%', left: '14%',  size: '3.5rem',rotate: '20deg',  opacity: 0.05 },
  { suit: '♥', top: '22%', right: '18%', size: '5rem',  rotate: '-5deg',  opacity: 0.06 },
  { suit: '♦', bottom: '30%', left: '22%', size: '4rem',rotate: '-12deg', opacity: 0.05 },
  { suit: '♣', bottom: '20%', right: '28%', size: '4.5rem',rotate: '8deg',opacity: 0.04 },
];

function CardSuitsWatermark() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {WATERMARK_SUITS.map((s, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: s.top,
            bottom: s.bottom,
            left: s.left,
            right: s.right,
            fontSize: s.size,
            opacity: s.opacity,
            transform: `rotate(${s.rotate})`,
            color: '#000',
            lineHeight: 1,
          }}
        >
          {s.suit}
        </span>
      ))}
    </div>
  );
}

/**
 * Computes the fan rotation for each card.
 * transformOrigin is set to 'bottom center' so cards fan out from the bottom.
 */
function getFanRotation(index: number, total: number): number {
  if (total <= 1) return 0;
  const maxAngle = 14;
  const centerIndex = (total - 1) / 2;
  const normalizedPos = (index - centerIndex) / centerIndex;
  return normalizedPos * maxAngle;
}

export default function GameRound() {
  const { state, send, dispatch } = useGame();
  const [previewCard, setPreviewCard] = useState<string | null>(null);
  const [jokerMode, setJokerMode] = useState(false);
  const [playedCardAnimation, setPlayedCardAnimation] = useState<{
    cardId: string;
    imageIndex: number;
  } | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    if (!state.roundText) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(state.roundText);
    utter.lang = 'de-DE';
    utter.rate = 0.9;
    const savedVoice = localStorage.getItem('tts-voice');
    if (savedVoice) {
      const voice = window.speechSynthesis.getVoices().find(v => v.name === savedVoice);
      if (voice) utter.voice = voice;
    }
    window.speechSynthesis.speak(utter);
    return () => { window.speechSynthesis.cancel(); };
  }, [state.roundText]);

  const handleSelectCard = (cardId: string) => {
    const card = state.hand.find(c => c.id === cardId);
    if (!card) return;
    setPlayedCardAnimation({ cardId, imageIndex: card.imageIndex });
    dispatch({ type: 'SELECT_CARD', cardId });
    send('selectCard', { lobbyId: state.lobbyId!, cardId });
    setPreviewCard(null);
  };

  useEffect(() => {
    if (
      playedCardAnimation &&
      !state.hand.find(c => c.id === playedCardAnimation.cardId)
    ) {
      const timer = setTimeout(() => setPlayedCardAnimation(null), 700);
      return () => clearTimeout(timer);
    }
  }, [state.hand, playedCardAnimation]);

  const handleUseJoker = (cardId: string) => {
    if (state.jokersRemaining <= 0) return;
    send('useJoker', { lobbyId: state.lobbyId!, cardId });
    setJokerMode(false);
  };

  const progressPct = state.totalPlayers
    ? (state.playersReady / state.totalPlayers) * 100
    : 0;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at center, #2d6a4a 0%, #1a3d2a 60%, #0f2218 100%)',
      }}
    >
      <CardSuitsWatermark />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-end px-5 pt-4">
        <div
          className="px-4 py-1.5 rounded-full text-sm font-bold text-gray-300"
          style={{
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          Runde <span className="text-white">{state.roundNumber}</span> /{' '}
          {state.totalRounds}
        </div>
      </div>

      {/* Round text */}
      <div className="relative z-10 flex justify-center mt-4 px-4">
        <div
          className="max-w-xl w-full rounded-2xl px-6 py-4 text-center"
          style={{
            background: 'rgba(0,0,0,0.62)',
            border: '1px solid rgba(212,160,32,0.45)',
            boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          }}
        >
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(212,160,32,0.7)' }}>
            Rundentext
          </p>
          <p className="text-2xl font-bold text-white leading-snug">{state.roundText}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 flex justify-center mt-4 px-4">
        <div className="max-w-lg w-full progress-track">
          <div
            className="progress-fill"
            style={{ width: `${progressPct}%` }}
          />
          <span className="progress-label text-sm font-semibold">
            {state.playersReady}/{state.totalPlayers} Spieler bereit
          </span>
        </div>
      </div>

      {/* Played face-down cards in center (only while choosing) */}
      {state.playersReady > 0 && (
        <div className="relative z-10 flex items-center justify-center gap-3 mt-6 px-4 min-h-[80px]">
          {Array.from({ length: state.playersReady }).map((_, i) => (
            <MemeCard key={`played-${i}`} imageIndex={0} faceDown size="sm" />
          ))}
        </div>
      )}

      {/* ── HAND CARDS — fan layout at the bottom ── */}
      <div
        className="relative z-20 flex justify-center items-end mt-auto pb-6"
        style={{ minHeight: '180px' }}
      >
        <div className="relative flex items-end justify-center">
          {state.hand.map((card, i) => {
            const angle = getFanRotation(i, state.hand.length);
            const isHovered = hoveredCard === card.id;
            const isSelected = state.selectedCardId === card.id;
            const isDisabled =
              state.selectedCardId !== null && !isSelected && !jokerMode;

            return (
              <div
                key={card.id}
                className="relative"
                style={{
                  // Fan rotation on the outer wrapper
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'bottom center',
                  zIndex: isHovered || isSelected ? 100 : 10 + i,
                  marginRight: i < state.hand.length - 1 ? '-28px' : '0',
                  transition: 'z-index 0s',
                }}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Deal-in animation wrapper */}
                <div
                  className="animate-deal-in"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <button
                    className={`block transition-all duration-200
                      ${isHovered && !isDisabled ? '-translate-y-5 scale-110' : ''}
                      ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                    onClick={() => {
                      if (isDisabled) return;
                      if (jokerMode) {
                        handleUseJoker(card.id);
                      } else {
                        setPreviewCard(card.id);
                      }
                    }}
                  >
                    <div className="relative">
                      <MemeCard
                        imageIndex={card.imageIndex}
                        selected={isSelected}
                        size="md"
                      />
                      {/* Joker mode overlay */}
                      {jokerMode && !isDisabled && (
                        <div
                          className="absolute inset-0 flex items-center justify-center rounded-xl"
                          style={{
                            background: 'rgba(212,160,32,0.25)',
                            border: '3px solid rgba(212,160,32,0.8)',
                          }}
                        >
                          <span className="text-2xl drop-shadow">↔️</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Joker button — bottom right, circular gold */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
        {jokerMode && (
          <button
            onClick={() => setJokerMode(false)}
            style={{
              padding: '0.5rem 1.1rem',
              borderRadius: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#fff',
              background: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.25)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Abbrechen
          </button>
        )}

        {/* Joker circular button — matches screenshot style */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          <button
            onClick={() => setJokerMode(!jokerMode)}
            disabled={state.jokersRemaining === 0 || state.selectedCardId !== null}
            title={state.jokersRemaining > 0 ? `Joker (${state.jokersRemaining} übrig)` : 'Keine Joker mehr'}
            style={{
              position: 'relative',
              width: '5.5rem',
              height: '5.5rem',
              borderRadius: '50%',
              border: jokerMode ? '3px solid rgba(255,255,255,0.9)' : '3px solid rgba(255,220,80,0.6)',
              cursor: state.jokersRemaining > 0 && !state.selectedCardId ? 'pointer' : 'not-allowed',
              opacity: state.jokersRemaining === 0 || state.selectedCardId !== null ? 0.4 : 1,
              transition: 'all 0.2s ease',
              background: jokerMode
                ? 'linear-gradient(145deg, #f0c030 0%, #c89010 50%, #a07010 100%)'
                : 'linear-gradient(145deg, #e8b820 0%, #c09010 50%, #9a7010 100%)',
              boxShadow: jokerMode
                ? '0 0 0 2px #fff, 0 6px 25px rgba(180,140,10,0.8), inset 0 2px 4px rgba(255,255,255,0.3)'
                : '0 6px 20px rgba(180,140,10,0.55), inset 0 2px 3px rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '900',
              color: '#3a2000',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              lineHeight: 1,
              textAlign: 'center',
              userSelect: 'none',
            }}>
              JOKER
            </span>
            {/* Count badge */}
            <span
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '1.7rem',
                height: '1.7rem',
                borderRadius: '50%',
                background: '#1a1200',
                border: '2px solid #f0c030',
                color: '#f0c030',
                fontSize: '0.85rem',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              }}
            >
              {state.jokersRemaining}
            </span>
          </button>
          {/* JOKER label below button */}
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: '800',
              letterSpacing: '0.1em',
              color: state.jokersRemaining > 0 && !state.selectedCardId ? '#d4a020' : 'rgba(255,255,255,0.3)',
            }}
          >
            JOKER
          </span>
        </div>
      </div>

      {/* ── Modal: Card preview / confirm play ── */}
      {previewCard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.78)' }}
          onClick={() => setPreviewCard(null)}
        >
          <div
            className="flex flex-col items-center gap-6 p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Card with gold glow ring */}
            <div
              style={{
                borderRadius: '1rem',
                overflow: 'hidden',
                boxShadow:
                  '0 0 0 4px #d4a020, 0 0 60px rgba(212, 160, 32, 0.65)',
              }}
            >
              {state.hand.find(c => c.id === previewCard) && (
                <MemeCard
                  imageIndex={state.hand.find(c => c.id === previewCard)!.imageIndex}
                  size="lg"
                />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 w-full max-w-sm">
              <button
                className="btn-secondary flex-1"
                onClick={() => setPreviewCard(null)}
              >
                Zurück
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => handleSelectCard(previewCard)}
              >
                Karte spielen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flying card animation when a card is played */}
      {playedCardAnimation && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div
            className="absolute"
            style={{
              left: 'calc(50% - 96px)',
              bottom: '160px',
              animation: 'cardPlayUp 0.7s ease-in-out forwards',
            }}
          >
            <MemeCard imageIndex={playedCardAnimation.imageIndex} faceDown size="md" />
          </div>
        </div>
      )}

      {/* Player seats (left/right sides, hidden on small screens) */}
      <PlayerSeats
        players={state.players}
        currentPlayerId={state.playerId}
        playersReady={state.playersReady}
        totalPlayers={state.totalPlayers}
        selectedCardId={state.selectedCardId}
      />

      <style>{`
        @keyframes cardPlayUp {
          0%   { transform: translateY(0)     scale(1)    rotate(0deg);   opacity: 1; }
          60%  { transform: translateY(-280px) scale(1.05) rotate(-6deg); opacity: 1; }
          100% { transform: translateY(-340px) scale(0.85) rotate(0deg);  opacity: 0; }
        }
      `}</style>
    </div>
  );
}
