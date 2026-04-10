import { useGame } from '../context/GameContext';
import MemeCard from './MemeCard';

export default function RoundResults() {
  const { state, send } = useGame();

  const handleNextRound = () => {
    send('nextRound', { lobbyId: state.lobbyId! });
  };

  const isLastRound = state.roundNumber >= state.totalRounds;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6 animate-slide-up">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold">Runde {state.roundNumber} — Ergebnis</h2>
          <p className="text-gray-400 text-sm">{state.roundText}</p>
        </div>

        {/* Results cards */}
        <div className="space-y-3">
          {state.roundResults.map((r, i) => (
            <div
              key={r.cardId}
              className={`card-container flex items-center gap-4 animate-slide-up
                ${i === 0 ? 'border-yellow-600/50 bg-yellow-900/10' : ''}
              `}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {/* Rank */}
              <div className="text-2xl font-bold w-8 text-center">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
              </div>

              {/* Card thumbnail */}
              <MemeCard imageIndex={r.imageIndex} size="sm" disabled />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{r.playerName}</p>
                <p className="text-sm text-gray-400">
                  {r.votes} {r.votes === 1 ? 'Stimme' : 'Stimmen'} &middot; +{r.pointsEarned} Punkte
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Scoreboard */}
        <div className="card-container">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Punktestand</h3>
          <div className="space-y-2">
            {state.scores.map((s, i) => (
              <div key={s.playerId} className="flex items-center justify-between text-sm">
                <span className={`${s.playerId === state.playerId ? 'text-indigo-400 font-semibold' : 'text-gray-300'}`}>
                  {i + 1}. {s.playerName}
                </span>
                <span className="font-mono text-indigo-400">{s.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next round button (host only) */}
        {state.isHost && !isLastRound && (
          <button className="btn-primary w-full" onClick={handleNextRound}>
            Nächste Runde
          </button>
        )}

        {!state.isHost && !isLastRound && (
          <p className="text-center text-gray-500 text-sm">Warte auf den Host...</p>
        )}
      </div>
    </div>
  );
}
