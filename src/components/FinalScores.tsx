import { useGame } from '../context/GameContext';

export default function FinalScores() {
  const { state, dispatch } = useGame();

  const handleBackToLobby = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-slide-up">
        {/* Trophy */}
        <div className="text-center space-y-3">
          <div className="text-7xl">🏆</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Spiel beendet!
          </h1>
        </div>

        {/* Winner highlight */}
        {state.finalScores.length > 0 && (
          <div className="card-container border-yellow-600/50 bg-gradient-to-br from-yellow-900/20 to-transparent text-center space-y-2">
            <p className="text-sm text-yellow-400 uppercase tracking-wider">Gewinner</p>
            <p className="text-2xl font-bold">{state.finalScores[0].playerName}</p>
            <p className="text-3xl font-mono text-yellow-400">{state.finalScores[0].score} Punkte</p>
          </div>
        )}

        {/* Full ranking */}
        <div className="space-y-2">
          {state.finalScores.map(fs => (
            <div
              key={fs.playerId}
              className={`card-container flex items-center gap-4 py-4
                ${fs.playerId === state.playerId ? 'border-indigo-600/50' : ''}
              `}
            >
              <div className="text-2xl font-bold w-10 text-center">
                {fs.rank === 1 ? '🥇' : fs.rank === 2 ? '🥈' : fs.rank === 3 ? '🥉' : `${fs.rank}.`}
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${fs.playerId === state.playerId ? 'text-indigo-400' : ''}`}>
                  {fs.playerName}
                  {fs.playerId === state.playerId && <span className="text-xs text-gray-500 ml-2">(Du)</span>}
                </p>
              </div>
              <div className="font-mono text-lg text-indigo-400">{fs.score}</div>
            </div>
          ))}
        </div>

        {/* Back button */}
        <button className="btn-primary w-full text-lg" onClick={handleBackToLobby}>
          Zurück zum Menü
        </button>
      </div>
    </div>
  );
}
