import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';
import PlayerSeats from './PlayerSeats';
import { useIsMobile } from '../hooks/useIsMobile';
import { getCardImageSrc } from '../utils/memeImage';
import { useTTS } from '../hooks/useTTS';

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
        <span key={i} style={{
          position: 'absolute', top: s.top, bottom: s.bottom, left: s.left, right: s.right,
          fontSize: s.size, opacity: s.opacity, transform: `rotate(${s.rotate})`, color: '#000', lineHeight: 1,
        }}>
          {s.suit}
        </span>
      ))}
    </div>
  );
}

function getFanRotation(index: number, total: number): number {
  if (total <= 1) return 0;
  const maxAngle = 14;
  const centerIndex = (total - 1) / 2;
  return ((index - centerIndex) / centerIndex) * maxAngle;
}

export default function GameRound() {
  const { state, send, dispatch } = useGame();
  const isMobile = useIsMobile(1100);
  const [previewCard, setPreviewCard] = useState<string | null>(null);
  const [jokerMode, setJokerMode] = useState(false);
  const [playedCardAnimation, setPlayedCardAnimation] = useState<{ cardId: string; imageIndex: number } | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [mobileBrowserOpen, setMobileBrowserOpen] = useState(false);
  const [mobileBrowserIndex, setMobileBrowserIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const memeSet = state.settings.memeSet ?? 'spongebob';
  const browserIdx = Math.min(mobileBrowserIndex, Math.max(0, state.hand.length - 1));
  const currentBrowserCard = state.hand[browserIdx] ?? null;

  const browseNext = () => setMobileBrowserIndex(i => Math.min(i + 1, state.hand.length - 1));
  const browsePrev = () => setMobileBrowserIndex(i => Math.max(i - 1, 0));

  const handleBrowserSwipeStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleBrowserSwipeEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) delta > 0 ? browseNext() : browsePrev();
    setTouchStartX(null);
  };

  const { speak, cancel } = useTTS();

  const handleCardClick = (cardId: string) => {
    const isDisabled = state.selectedCardId !== null && state.selectedCardId !== cardId && !jokerMode;
    if (isDisabled) return;
    if (jokerMode) { handleUseJoker(cardId); }
    else { setPreviewCard(cardId); }
  };

  useEffect(() => {
    if (!state.roundText) return;
    speak(state.roundText);
    return () => { cancel(); };
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
    if (playedCardAnimation && !state.hand.find(c => c.id === playedCardAnimation.cardId)) {
      const timer = setTimeout(() => setPlayedCardAnimation(null), 700);
      return () => clearTimeout(timer);
    }
  }, [state.hand, playedCardAnimation]);

  const handleUseJoker = (cardId: string) => {
    if (state.jokersRemaining <= 0) return;
    send('useJoker', { lobbyId: state.lobbyId!, cardId });
    setJokerMode(false);
  };

  const progressPct = state.totalPlayers ? (state.playersReady / state.totalPlayers) * 100 : 0;
  const jokerAvailable = state.jokersRemaining > 0 && !state.selectedCardId;

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #2d6a4a 0%, #1a3d2a 60%, #0f2218 100%)' }}
    >
      <CardSuitsWatermark />

      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)',
      }} />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-end px-5 pt-4">
        <div className="px-4 py-1.5 rounded-full text-sm font-bold text-gray-300" style={{
          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
        }}>
          Runde <span className="text-white">{state.roundNumber}</span> / {state.totalRounds}
        </div>
      </div>

      {/* Round text */}
      <div className="relative z-10 flex justify-center mt-4 px-4">
        <div className="max-w-xl w-full rounded-2xl text-center" style={{
          background: 'rgba(0,0,0,0.62)',
          border: '1px solid rgba(212,160,32,0.45)',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          padding: isMobile ? '0.6rem 1rem' : '1rem 1.5rem',
        }}>
          {!isMobile && (
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'rgba(212,160,32,0.7)' }}>
              Rundentext
            </p>
          )}
          <p className="font-bold text-white leading-snug" style={{ fontSize: isMobile ? '1rem' : '1.5rem' }}>
            {state.roundText}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 flex justify-center mt-4 px-4">
        <div className="max-w-lg w-full progress-track">
          <div className="progress-fill" style={{ width: `${progressPct}%` }} />
          <span className="progress-label text-sm font-semibold">
            {state.playersReady}/{state.totalPlayers} Spieler bereit
          </span>
        </div>
      </div>

      {/* Played face-down cards — stacked deck */}
      {state.playersReady > 0 && (
        <div className="relative z-10 flex justify-center mt-4">
          <div style={{
            position: 'relative',
            width: `${128 + (state.playersReady - 1) * 6}px`,
            height: `${80 + (state.playersReady - 1) * 4}px`,
          }}>
            {Array.from({ length: state.playersReady }).map((_, i) => (
              <div key={`played-${i}`} style={{
                position: 'absolute',
                left: `${i * 6}px`,
                top: `${(state.playersReady - 1 - i) * 4}px`,
                zIndex: i,
                transform: `rotate(${(i - (state.playersReady - 1) / 2) * 1.5}deg)`,
              }}>
                <MemeCard imageIndex={0} faceDown size="sm" />
              </div>
            ))}
            <div style={{
              position: 'absolute', top: '-10px', right: '-14px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#d4a020', color: '#1a0f00', fontSize: '0.75rem', fontWeight: '900',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,0,0,0.5)', zIndex: 100,
            }}>
              {state.playersReady}
            </div>
          </div>
        </div>
      )}

      {/* ── HAND CARDS ── */}
      {isMobile ? (
        <>
          {/* Bottom-center card stack — tap to open browser */}
          {state.hand.length > 0 && (
            <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}>
              <button
                onClick={() => { setMobileBrowserIndex(0); setMobileBrowserOpen(true); }}
                style={{
                  position: 'relative',
                  width: `${90 + (state.hand.length - 1) * 28}px`,
                  height: '72px',
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                }}
              >
                {state.hand.map((card, i) => {
                  const isSelected = state.selectedCardId === card.id;
                  const centerOffset = i - (state.hand.length - 1) / 2;
                  return (
                    <div key={card.id} style={{
                      position: 'absolute',
                      left: `${i * 28}px`,
                      top: `${Math.abs(centerOffset) * 2}px`,
                      zIndex: i,
                      width: '90px', height: '62px', borderRadius: '8px',
                      border: isSelected ? '2px solid #22c55e' : '1.5px solid rgba(255,255,255,0.3)',
                      overflow: 'hidden', background: '#1a3d2a',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.6)',
                      transform: `rotate(${centerOffset * 3}deg)`,
                      transformOrigin: 'bottom center',
                    }}>
                      <img
                        src={getCardImageSrc(card.imageIndex, memeSet)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        onError={e => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      />
                      {isSelected && (
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          background: 'rgba(34,197,94,0.35)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: '0.9rem' }}>✓</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* Count badge */}
                <div style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: '#d4a020', color: '#1a0f00', fontSize: '0.7rem', fontWeight: '900',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)', zIndex: 999,
                }}>
                  {state.hand.length}
                </div>
              </button>
            </div>
          )}

          {/* Card browser modal */}
          {mobileBrowserOpen && currentBrowserCard && (
            <div
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 60,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '1rem', padding: '1.5rem',
              }}
              onTouchStart={handleBrowserSwipeStart}
              onTouchEnd={handleBrowserSwipeEnd}
            >
              {/* Counter + close */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                width: '100%',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                  Karte {browserIdx + 1} / {state.hand.length}
                </span>
                <button
                  onClick={() => { setMobileBrowserOpen(false); setJokerMode(false); }}
                  style={{
                    background: 'none', border: 'none',
                    color: 'rgba(255,255,255,0.6)', fontSize: '1.5rem',
                    cursor: 'pointer', lineHeight: 1, padding: '0.25rem',
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Card — fills full modal width for better meme visibility */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '3/2' }}>
                <MemeCard
                  imageIndex={currentBrowserCard.imageIndex}
                  size="xl"
                  selected={state.selectedCardId === currentBrowserCard.id}
                  style={{ width: '100%', height: '100%' }}
                />
                {jokerMode && state.selectedCardId !== currentBrowserCard.id && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                    style={{ background: 'rgba(212,160,32,0.25)', border: '3px solid rgba(212,160,32,0.8)' }}>
                    <span style={{ fontSize: '2.5rem' }}></span>
                  </div>
                )}
              </div>

              {/* Arrows + dot indicators in one row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}>
                <button
                  onClick={browsePrev}
                  disabled={browserIdx === 0}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', fontSize: '1.1rem', cursor: browserIdx === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: browserIdx === 0 ? 0.25 : 1,
                  }}
                >
                  ‹
                </button>
                {state.hand.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setMobileBrowserIndex(i)}
                    style={{
                      width: i === browserIdx ? '20px' : '8px',
                      height: '8px', borderRadius: '9999px', border: 'none', cursor: 'pointer', padding: 0,
                      background: i === browserIdx ? '#d4a020' : state.selectedCardId === c.id ? '#22c55e' : 'rgba(255,255,255,0.3)',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
                <button
                  onClick={browseNext}
                  disabled={browserIdx === state.hand.length - 1}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#fff', fontSize: '1.1rem',
                    cursor: browserIdx === state.hand.length - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: browserIdx === state.hand.length - 1 ? 0.25 : 1,
                  }}
                >
                  ›
                </button>
              </div>

              {/* Action buttons */}
              {jokerMode ? (
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                  <button
                    onClick={() => setJokerMode(false)}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '0.75rem',
                      fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                      background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => handleUseJoker(currentBrowserCard.id)}
                    style={{
                      flex: 1, padding: '0.75rem', borderRadius: '0.75rem',
                      fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
                      background: 'linear-gradient(135deg, #d4a020, #9a7010)',
                      border: 'none', color: '#1a0f00',
                    }}
                  >
                    Joker nutzen
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%', alignItems: 'center' }}>
                  {/* Joker circular button */}
                  <button
                    onClick={() => setJokerMode(true)}
                    disabled={!jokerAvailable}
                    style={{
                      width: '56px', height: '56px', borderRadius: '50%', flexShrink: 0,
                      background: jokerAvailable
                        ? 'linear-gradient(145deg, #e8b820, #c09010)'
                        : 'rgba(40,40,40,0.8)',
                      border: jokerAvailable
                        ? '2px solid rgba(255,220,80,0.6)'
                        : '2px solid rgba(255,255,255,0.1)',
                      cursor: jokerAvailable ? 'pointer' : 'not-allowed',
                      opacity: jokerAvailable ? 1 : 0.4,
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{
                      fontSize: '0.6rem', fontWeight: '900', letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      color: jokerAvailable ? '#3a2000' : 'rgba(255,255,255,0.3)',
                    }}>
                      JOKER
                    </span>
                    <span style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '18px', height: '18px', borderRadius: '50%',
                      background: '#1a1200', border: '2px solid #f0c030',
                      color: '#f0c030', fontSize: '0.65rem', fontWeight: '900',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {state.jokersRemaining}
                    </span>
                  </button>

                  {/* Play button */}
                  <button
                    onClick={() => {
                      if (!state.selectedCardId) {
                        handleSelectCard(currentBrowserCard.id);
                        setMobileBrowserOpen(false);
                      }
                    }}
                    disabled={!!state.selectedCardId}
                    style={{
                      flex: 1, padding: '0.75rem 1rem', borderRadius: '0.75rem',
                      fontWeight: '700', fontSize: '1rem', border: 'none',
                      cursor: state.selectedCardId ? 'not-allowed' : 'pointer',
                      background: state.selectedCardId === currentBrowserCard.id
                        ? 'linear-gradient(135deg, #22c55e, #15803d)'
                        : state.selectedCardId
                          ? 'rgba(40,40,40,0.8)'
                          : 'linear-gradient(135deg, #d4a020, #9a7010)',
                      color: state.selectedCardId && state.selectedCardId !== currentBrowserCard.id
                        ? 'rgba(255,255,255,0.3)'
                        : '#fff',
                    }}
                  >
                    {state.selectedCardId === currentBrowserCard.id
                      ? '✓ Gespielt'
                      : state.selectedCardId
                        ? 'Karte gespielt'
                        : 'Karte spielen'}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        /* Desktop: fan layout at the bottom */
        <div className="relative z-20 flex justify-center items-end mt-auto pb-6" style={{ minHeight: '180px' }}>
          <div className="relative flex items-end justify-center">
            {state.hand.map((card, i) => {
              const angle = getFanRotation(i, state.hand.length);
              const isHovered = hoveredCard === card.id;
              const isSelected = state.selectedCardId === card.id;
              const isDisabled = state.selectedCardId !== null && !isSelected && !jokerMode;

              return (
                <div
                  key={card.id}
                  className="relative"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'bottom center',
                    zIndex: isHovered || isSelected ? 100 : 10 + i,
                    marginRight: i < state.hand.length - 1 ? '-28px' : '0',
                    transition: 'z-index 0s',
                  }}
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="animate-deal-in" style={{ animationDelay: `${i * 120}ms` }}>
                    <button
                      className={`block transition-all duration-200
                        ${isHovered && !isDisabled ? '-translate-y-5 scale-110' : ''}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      onClick={() => handleCardClick(card.id)}
                    >
                      <div className="relative">
                        <MemeCard imageIndex={card.imageIndex} selected={isSelected} size="md" />
                        {jokerMode && !isDisabled && (
                          <div
                            className="absolute inset-0 flex items-center justify-center rounded-xl"
                            style={{ background: 'rgba(212,160,32,0.25)', border: '3px solid rgba(212,160,32,0.8)' }}
                          >
                            <span className="text-2xl drop-shadow"></span>
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
      )}

      {/* Joker button — desktop only */}
      {!isMobile && (
        <div className="fixed z-30 flex items-center gap-3 bottom-[5.5rem] right-6">
          {jokerMode && (
            <button
              onClick={() => setJokerMode(false)}
              style={{
                padding: '0.5rem 1.1rem', borderRadius: '0.75rem',
                fontSize: '0.85rem', fontWeight: '700', color: '#fff',
                background: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.25)',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              Abbrechen
            </button>
          )}

          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <button
              onClick={() => setJokerMode(!jokerMode)}
              disabled={!jokerAvailable}
              title={state.jokersRemaining > 0 ? `Joker (${state.jokersRemaining} übrig)` : 'Keine Joker mehr'}
              style={{
                position: 'relative', width: '5.5rem', height: '5.5rem', borderRadius: '50%',
                border: jokerMode ? '3px solid rgba(255,255,255,0.9)' : '3px solid rgba(255,220,80,0.6)',
                cursor: jokerAvailable ? 'pointer' : 'not-allowed',
                opacity: jokerAvailable ? 1 : 0.4,
                transition: 'all 0.2s ease',
                background: jokerMode
                  ? 'linear-gradient(145deg, #f0c030 0%, #c89010 50%, #a07010 100%)'
                  : 'linear-gradient(145deg, #e8b820 0%, #c09010 50%, #9a7010 100%)',
                boxShadow: jokerMode
                  ? '0 0 0 2px #fff, 0 6px 25px rgba(180,140,10,0.8), inset 0 2px 4px rgba(255,255,255,0.3)'
                  : '0 6px 20px rgba(180,140,10,0.55), inset 0 2px 3px rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <span style={{
                fontSize: '0.85rem', fontWeight: '900', color: '#3a2000',
                letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1,
                textAlign: 'center', userSelect: 'none',
              }}>
                JOKER
              </span>
              <span style={{
                position: 'absolute', top: '-6px', right: '-6px',
                width: '1.7rem', height: '1.7rem', borderRadius: '50%',
                background: '#1a1200', border: '2px solid #f0c030',
                color: '#f0c030', fontSize: '0.85rem', fontWeight: '900',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
              }}>
                {state.jokersRemaining}
              </span>
            </button>
            <span style={{
              fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.1em',
              color: jokerAvailable ? '#d4a020' : 'rgba(255,255,255,0.3)',
            }}>
              JOKER
            </span>
          </div>
        </div>
      )}

      {/* Card preview modal — desktop only */}
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
            <div style={{
              borderRadius: '1rem', overflow: 'hidden',
              boxShadow: '0 0 0 4px #d4a020, 0 0 60px rgba(212, 160, 32, 0.65)',
            }}>
              {state.hand.find(c => c.id === previewCard) && (
                <MemeCard imageIndex={state.hand.find(c => c.id === previewCard)!.imageIndex} size="lg" />
              )}
            </div>
            <div className="flex gap-4 w-full max-w-sm">
              <button className="btn-secondary flex-1" onClick={() => setPreviewCard(null)}>
                Zurück
              </button>
              <button className="btn-primary flex-1" onClick={() => handleSelectCard(previewCard)}>
                Karte spielen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flying card animation */}
      {playedCardAnimation && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div className="absolute" style={{
            left: 'calc(50% - 96px)', bottom: '160px',
            animation: 'cardPlayUp 0.7s ease-in-out forwards',
          }}>
            <MemeCard imageIndex={playedCardAnimation.imageIndex} faceDown size="md" />
          </div>
        </div>
      )}

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
