import { useState } from 'react';
import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';
import PlayerList from './PlayerList';

export default function GameRound() {
  const { state, send, dispatch } = useGame();
  const [previewCard, setPreviewCard] = useState<string | null>(null);
  const [jokerMode, setJokerMode] = useState(false);

  const handleSelectCard = (cardId: string) => {
    dispatch({ type: 'SELECT_CARD', cardId });
    send('selectCard', { lobbyId: state.lobbyId!, cardId });
    setPreviewCard(null);
  };

  const handleUseJoker = (cardId: string) => {
    if (state.jokersRemaining <= 0) return;
    send('useJoker', { lobbyId: state.lobbyId!, cardId });
    setJokerMode(false);
  };


  // Calculate fan layout
  const maxAngle = Math.min(25, (state.hand.length - 1) * 5);
  const getCardTransform = (index: number) => {
    if (state.hand.length <= 1) {
      return { transform: 'rotate(0deg) translateY(0px)' };
    }
    const rot = -maxAngle + (index / (state.hand.length - 1)) * maxAngle * 2;
    const liftY = -Math.abs(rot) * 0.8;
    return {
      transform: `rotate(${rot}deg) translateY(${liftY}px)`,
      transformOrigin: 'bottom center',
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

      {/* Cards - fanned at bottom center */}
      <div className="flex-1 flex flex-col justify-end items-center pb-8 relative z-20">
        <div className="relative" style={{ width: '800px', height: '280px', perspective: '1200px' }}>
          <div className="absolute inset-0 flex items-end justify-center">
            {visibleHand.map((card, i) => (
              <div
                key={card.id}
                className={`group relative transition-all duration-200 ${
                  jokerMode ? 'cursor-swap' : 'cursor-pointer'
                } animate-deal-in`}
                style={{
                  ...getCardTransform(i),
                  zIndex: state.selectedCardId === card.id ? 50 : 20 + i,
                  animationDelay: `${i * 150}ms`,
                }}
              >
                <button
                  className={`relative block transition-all duration-200 hover:scale-125 hover:-translate-y-6 hover:z-50
                    ${jokerMode ? 'ring-4 ring-yellow-500/50 rounded-xl' : ''}
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
                  {jokerMode && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl pointer-events-none">
                      <span className="text-2xl font-bold text-yellow-300 drop-shadow-lg">↔️</span>
                    </div>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Joker button - bottom right */}
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-3">
        {jokerMode && (
          <button
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-white font-medium transition-colors"
            onClick={() => setJokerMode(false)}
          >
            Abbrechen
          </button>
        )}
        <button
          className={`px-4 py-3 rounded-lg text-white font-semibold transition-all flex items-center gap-2
            ${state.jokersRemaining > 0 && !state.selectedCardId
              ? 'bg-yellow-600 hover:bg-yellow-500 cursor-pointer'
              : 'bg-gray-600 opacity-50 cursor-not-allowed'
            }
          `}
          onClick={() => setJokerMode(!jokerMode)}
          disabled={state.jokersRemaining === 0 || state.selectedCardId !== null}
        >
          🔄 <span className="text-sm">{state.jokersRemaining}</span>
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


      {/* Side: Player list */}
      <div className="fixed right-4 top-4 w-48 hidden lg:block z-10">
        <div className="card-container">
          <PlayerList players={state.players} hostId={state.hostId} currentPlayerId={state.playerId} />
        </div>
      </div>
    </div>
  );
}
