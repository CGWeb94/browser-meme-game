import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';
import PlayerList from './PlayerList';

export default function GameRound() {
  const { state, send, dispatch } = useGame();

  const handleSelectCard = (cardId: string) => {
    dispatch({ type: 'SELECT_CARD', cardId });
    send('selectCard', { lobbyId: state.lobbyId!, cardId });
  };

  const handleUseJoker = (cardId: string) => {
    if (state.jokersRemaining <= 0) return;
    send('useJoker', { lobbyId: state.lobbyId!, cardId });
  };

  return (
    <div className="min-h-screen flex flex-col p-4">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-400">
          Runde <span className="text-white font-bold">{state.roundNumber}</span> / {state.totalRounds}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Joker: <span className="text-yellow-400">{state.jokersRemaining}</span>
          </span>
          <span className="text-sm text-gray-500">
            Karten: <span className="text-indigo-400">{state.hand.length}</span>
          </span>
        </div>
      </div>

      {/* Round text */}
      <div className="card-container text-center mb-6">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Rundentext</p>
        <p className="text-xl font-semibold text-white leading-relaxed">
          {state.roundText}
        </p>
      </div>

      {/* Status */}
      <div className="text-center mb-4">
        {state.selectedCardId ? (
          <div className="space-y-2">
            <p className="text-green-400 text-sm font-medium">Karte gewählt! Warte auf andere...</p>
            <p className="text-gray-500 text-xs">{state.playersReady} / {state.totalPlayers} Spieler bereit</p>
            <div className="w-48 mx-auto bg-gray-800 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${state.totalPlayers ? (state.playersReady / state.totalPlayers) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Wähle eine Karte aus deiner Hand</p>
        )}
      </div>

      {/* Hand */}
      <div className="flex-1 flex flex-col justify-end">
        <div className="mb-4">
          <div className="flex gap-3 overflow-x-auto pb-4 px-2 snap-x">
            {state.hand.map(card => (
              <div key={card.id} className="snap-center flex-shrink-0 relative group">
                <MemeCard
                  imageIndex={card.imageIndex}
                  selected={state.selectedCardId === card.id}
                  onClick={() => handleSelectCard(card.id)}
                />
                {/* Joker button */}
                {state.jokersRemaining > 0 && !state.selectedCardId && (
                  <button
                    className="absolute -top-2 -right-2 w-7 h-7 bg-yellow-600 hover:bg-yellow-500 rounded-full
                               text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity
                               flex items-center justify-center shadow-lg"
                    onClick={(e) => { e.stopPropagation(); handleUseJoker(card.id); }}
                    title="Joker: Karte tauschen"
                  >
                    🔄
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side: Player list */}
      <div className="fixed right-4 top-4 w-48 hidden lg:block">
        <div className="card-container">
          <PlayerList players={state.players} hostId={state.hostId} currentPlayerId={state.playerId} />
        </div>
      </div>
    </div>
  );
}
