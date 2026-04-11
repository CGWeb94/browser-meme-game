import { useGame } from '../context/GameContext';

export default function FinalScores() {
  const { state, dispatch } = useGame();

  const handleBackToLobby = () => {
    dispatch({ type: 'RESET' });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6"
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

      {/* Trophy */}
      <div className="relative z-10 text-center mt-8 mb-6 animate-slide-up">
        <div className="text-6xl mb-3">🏆</div>
        <h1
          className="text-3xl font-black"
          style={{
            background: 'linear-gradient(135deg, #d4a020 0%, #f0c040 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Spiel beendet!
        </h1>
      </div>

      {/* Winner highlight */}
      {state.finalScores.length > 0 && (
        <div
          className="relative z-10 w-full max-w-sm text-center rounded-2xl px-6 py-5 mb-6 animate-slide-up"
          style={{
            background: 'rgba(0,0,0,0.45)',
            border: '1px solid rgba(212,160,32,0.45)',
            boxShadow: '0 0 30px rgba(212,160,32,0.15)',
            animationDelay: '80ms',
          }}
        >
          <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: '#d4a020' }}>
            Gewinner
          </p>
          <p className="text-2xl font-black text-white">{state.finalScores[0].playerName}</p>
          <p className="text-3xl font-black mt-1" style={{ color: '#d4a020' }}>
            {state.finalScores[0].score} Punkte
          </p>
        </div>
      )}

      {/* Full ranking */}
      <div
        className="relative z-10 w-full max-w-sm space-y-2 animate-slide-up"
        style={{ animationDelay: '160ms' }}
      >
        {state.finalScores.map((fs, i) => (
          <div
            key={fs.playerId}
            className="flex items-center gap-4 px-5 py-3 rounded-2xl transition-all"
            style={{
              background:
                fs.playerId === state.playerId
                  ? 'rgba(212,160,32,0.1)'
                  : 'rgba(0,0,0,0.35)',
              border:
                fs.playerId === state.playerId
                  ? '1px solid rgba(212,160,32,0.35)'
                  : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="text-2xl font-bold w-10 text-center">
              {fs.rank === 1 ? '🥇' : fs.rank === 2 ? '🥈' : fs.rank === 3 ? '🥉' : `${fs.rank}.`}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`font-semibold truncate ${
                  fs.playerId === state.playerId ? '' : 'text-gray-200'
                }`}
                style={fs.playerId === state.playerId ? { color: '#d4a020' } : {}}
              >
                {fs.playerName}
                {fs.playerId === state.playerId && (
                  <span className="text-xs text-gray-500 ml-2 font-normal">(Du)</span>
                )}
              </p>
            </div>
            <div
              className="font-mono text-lg font-bold"
              style={{ color: '#d4a020' }}
            >
              {fs.score}
            </div>
          </div>
        ))}
      </div>

      {/* Back button */}
      <div className="relative z-10 w-full max-w-sm mt-8 animate-slide-up" style={{ animationDelay: '240ms' }}>
        <button className="btn-primary w-full text-base" onClick={handleBackToLobby}>
          Zurück zum Menü
        </button>
      </div>
    </div>
  );
}
