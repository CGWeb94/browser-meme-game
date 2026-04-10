import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';

export default function CardReveal() {
  const { state, send, dispatch } = useGame();

  const handleVote = (cardId: string) => {
    dispatch({ type: 'VOTE_CARD', cardId });
    send('vote', { lobbyId: state.lobbyId!, cardId });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-6 animate-slide-up">
        {/* Round text reminder */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Rundentext</p>
          <p className="text-lg font-semibold text-white">{state.roundText}</p>
        </div>

        {/* Instruction */}
        <div className="text-center">
          {state.votedCardId ? (
            <div className="space-y-2">
              <p className="text-green-400 text-sm font-medium">Stimme abgegeben!</p>
              <p className="text-gray-500 text-xs">{state.playersReady} / {state.totalPlayers} haben abgestimmt</p>
              <div className="w-48 mx-auto bg-gray-800 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${state.totalPlayers ? (state.playersReady / state.totalPlayers) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-green-400 text-sm font-medium">Stimme für die beste Karte!</p>
          )}
        </div>

        {/* Revealed cards grid */}
        <div className="flex flex-wrap justify-center gap-4">
          {state.revealedCards.map((rc, i) => (
            <div
              key={rc.cardId}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <MemeCard
                imageIndex={rc.imageIndex}
                size="lg"
                selected={state.votedCardId === rc.cardId}
                disabled={!!state.votedCardId}
                onClick={() => !state.votedCardId && handleVote(rc.cardId)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
