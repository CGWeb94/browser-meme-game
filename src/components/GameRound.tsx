import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';
import PlayerSeats from './PlayerSeats';

export default function GameRound() {
  const { state, send, dispatch } = useGame();
  const [previewCard, setPreviewCard] = useState<string | null>(null);
  const [jokerMode, setJokerMode] = useState(false);
  const [playedCardAnimation, setPlayedCardAnimation] = useState<{ cardId: string; cardIndex: number } | null>(null);
  const [drawnCard, setDrawnCard] = useState<any>(null);

  // Handle drawn card animation
  useEffect(() => {
    if (state.hand.length > 0 && drawnCard === null) {
      const lastCard = state.hand[state.hand.length - 1];
      if (lastCard && !playedCardAnimation) {
        setDrawnCard(lastCard);
        const timer = setTimeout(() => setDrawnCard(null), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [state.hand.length, playedCardAnimation, drawnCard]);

  const handleSelectCard = (cardId: string) => {
    const cardIndex = state.hand.findIndex(c => c.id === cardId);
    setPlayedCardAnimation({ cardId, cardIndex });
    dispatch({ type: 'SELECT_CARD', cardId });
    send('selectCard', { lobbyId: state.lobbyId!, cardId });
    setPreviewCard(null);
  };

  // Cleanup animation after card is removed from hand
  useEffect(() => {
    if (playedCardAnimation && !state.hand.find(c => c.id === playedCardAnimation.cardId)) {
      const timer = setTimeout(() => setPlayedCardAnimation(null), 600);
      return () => clearTimeout(timer);
    }
  }, [state.hand, playedCardAnimation]);

  const handleUseJoker = (cardId: string) => {
    if (state.jokersRemaining <= 0) return;
    send('useJoker', { lobbyId: state.lobbyId!, cardId });
    setJokerMode(false);
  };


  // Calculate card overlap layout (simple horizontal with negative margin)
  const getCardTransform = (index: number) => {
    return {
      marginRight: '-48px', // overlap cards
    };
  };

  // Show all cards immediately, but stagger the animation
  const visibleHand = state.hand;

  return (
    <div className="min-h-screen flex flex-col p-4 relative"
      style={{
        background: 'radial-gradient(ellipse at center, #2d6a4a 0%, #0f2d1a 100%)'
      }}
    >
      {/* Vignette overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div className="text-sm text-gray-300">
          Runde <span className="text-white font-bold">{state.roundNumber}</span> / {state.totalRounds}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            Karten: <span className="text-green-400">{state.hand.length}</span>
          </span>
        </div>
      </div>

      {/* Round text - centered top */}
      <div className="card-container text-center mb-6 relative z-10 max-w-2xl mx-auto">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Rundentext</p>
        <p className="text-xl font-semibold text-white leading-relaxed">
          {state.roundText}
        </p>
      </div>

      {/* Status */}
      <div className="text-center mb-6 relative z-10">
        {state.selectedCardId ? (
          <div className="space-y-2">
            <p className="text-green-400 text-sm font-medium">Karte gespielt! Warte auf andere...</p>
            <p className="text-gray-400 text-xs">{state.playersReady} / {state.totalPlayers} Spieler bereit</p>
            <div className="w-48 mx-auto bg-gray-800/50 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${state.totalPlayers ? (state.playersReady / state.totalPlayers) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-indigo-300 text-sm">Wähle eine Karte aus deiner Hand</p>
        )}
      </div>

      {/* Played cards in center */}
      {state.selectedCardId && (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <div className="flex flex-wrap gap-3 justify-center items-center">
            {Array.from({ length: state.playersReady }).map((_, i) => (
              <MemeCard key={`played-${i}`} imageIndex={0} faceDown size="md" />
            ))}
          </div>
          <p className="text-gray-400 text-xs mt-4">
            {state.playersReady} / {state.totalPlayers} Spieler haben gespielt
          </p>
        </div>
      )}

      {/* Cards - simple horizontal overlap at bottom center */}
      <div className="flex-1 flex flex-col justify-end items-center pb-8 relative z-20">
        <div className="flex items-end justify-center gap-0">
          {visibleHand.map((card, i) => (
            <div
              key={card.id}
              className="group relative transition-all duration-200 animate-deal-in hover:scale-125 hover:-translate-y-6 hover:z-50"
              style={{
                marginRight: '-48px',
                zIndex: state.selectedCardId === card.id ? 50 : 20 + i,
                animationDelay: `${i * 150}ms`,
              }}
            >
              <button
                className={`relative block transition-all duration-200 ${
                  jokerMode ? 'cursor-swap ring-4 ring-green-500/60 rounded-xl' : 'cursor-pointer'
                }
                  ${previewCard === card.id ? 'scale-125 -translate-y-6' : ''}
                `}
                onClick={() => {
                  if (jokerMode) {
                    handleUseJoker(card.id);
                  } else {
                    setPreviewCard(card.id);
                  }
                }}
                disabled={state.selectedCardId !== null && state.selectedCardId !== card.id}
              >
                <MemeCard
                  imageIndex={card.imageIndex}
                  selected={state.selectedCardId === card.id}
                  disabled={state.selectedCardId !== null && state.selectedCardId !== card.id}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Joker button - bottom right */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2">
        {jokerMode && (
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white font-medium transition-colors"
            onClick={() => setJokerMode(false)}
          >
            Abbrechen
          </button>
        )}
        <button
          className={`px-6 py-4 rounded-xl font-semibold transition-all flex items-center gap-3 shadow-lg
            ${state.jokersRemaining > 0 && !state.selectedCardId
              ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer shadow-green-600/50'
              : 'bg-gray-700 opacity-50 text-gray-400 cursor-not-allowed'
            }
          `}
          onClick={() => setJokerMode(!jokerMode)}
          disabled={state.jokersRemaining === 0 || state.selectedCardId !== null}
          title={state.jokersRemaining > 0 ? `Joker verwenden (${state.jokersRemaining} übrig)` : 'Keine Joker mehr verfügbar'}
        >
          <img src="/joker.svg" alt="Joker" style={{ width: '5rem', height: '7rem' }} className="object-contain" />
          <span className="text-lg">{state.jokersRemaining}</span>
        </button>
      </div>

      {/* Modal - Card preview */}
      {previewCard && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
          onClick={() => setPreviewCard(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl p-8 max-w-lg w-full mx-4 space-y-6 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-center">Diese Karte spielen?</h2>

            <div className="flex justify-center">
              {state.hand.find(c => c.id === previewCard) && (
                <MemeCard
                  imageIndex={state.hand.find(c => c.id === previewCard)!.imageIndex}
                  size="lg"
                />
              )}
            </div>

            <div className="flex gap-4">
              <button
                className="flex-1 btn-secondary"
                onClick={() => setPreviewCard(null)}
              >
                Abbrechen
              </button>
              <button
                className="flex-1 btn-primary"
                onClick={() => handleSelectCard(previewCard)}
              >
                Spielen
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Card play animation - flying card from hand to center */}
      {playedCardAnimation && (
        <div className="fixed inset-0 pointer-events-none z-40">
          <div
            className="absolute"
            style={{
              left: 'calc(50% - 48px)',
              top: 'calc(50% + 120px)',
              animation: 'cardPlay 0.6s ease-in-out forwards',
            }}
          >
            <MemeCard
              imageIndex={state.hand.find(c => c.id === playedCardAnimation.cardId)?.imageIndex ?? 0}
              faceDown
              size="md"
            />
          </div>
        </div>
      )}

      {/* Player seats around table */}
      <PlayerSeats
        players={state.players}
        currentPlayerId={state.playerId}
        playersReady={state.playersReady}
        totalPlayers={state.totalPlayers}
        selectedCardId={state.selectedCardId}
      />

      <style>{`
        @keyframes cardPlay {
          0% {
            transform: translateY(280px) scale(1) rotateZ(0deg);
            opacity: 1;
          }
          50% {
            transform: translateY(100px) scale(1.05) rotateZ(-5deg);
          }
          100% {
            transform: translateY(0px) scale(1) rotateZ(0deg);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
