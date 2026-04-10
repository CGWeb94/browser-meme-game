import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function SentenceCollection() {
  const { state, send, dispatch } = useGame();
  const [sentences, setSentences] = useState<string[]>(
    Array(state.sentencesRequested || 1).fill('')
  );

  const handleSubmit = () => {
    const valid = sentences.filter(s => s.trim().length > 0);
    if (valid.length === 0) return;
    send('submitSentences', { lobbyId: state.lobbyId!, sentences: valid });
    dispatch({ type: 'SENTENCES_SUBMITTED' });
  };

  const updateSentence = (index: number, value: string) => {
    const updated = [...sentences];
    updated[index] = value;
    setSentences(updated);
  };

  if (state.sentencesSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card-container max-w-md w-full text-center space-y-4 animate-slide-up">
          <div className="text-5xl animate-pulse-slow">✍️</div>
          <h2 className="text-xl font-bold">Sätze eingereicht!</h2>
          <p className="text-gray-400">
            Warte auf die anderen Spieler...
          </p>
          <div className="text-sm text-gray-500">
            {state.playersReady} / {state.totalPlayers} Spieler fertig
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${state.totalPlayers ? (state.playersReady / state.totalPlayers) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card-container max-w-md w-full space-y-6 animate-slide-up">
        <div className="text-center space-y-2">
          <div className="text-4xl">✍️</div>
          <h2 className="text-xl font-bold">Schreibe deine Sätze</h2>
          <p className="text-gray-400 text-sm">
            Beschreibe lustige Situationen, zu denen die anderen Memes legen sollen
          </p>
        </div>

        <div className="space-y-4">
          {sentences.map((s, i) => (
            <div key={i}>
              <label className="block text-xs text-gray-500 mb-1">Satz {i + 1}</label>
              <input
                className="input-field"
                placeholder="z.B. 'Wenn der Chef fragt, warum du zu spät bist...'"
                value={s}
                onChange={e => updateSentence(i, e.target.value)}
                maxLength={200}
              />
            </div>
          ))}
        </div>

        <button
          className="btn-primary w-full"
          onClick={handleSubmit}
          disabled={sentences.every(s => s.trim().length === 0)}
        >
          Absenden
        </button>
      </div>
    </div>
  );
}
