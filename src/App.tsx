import { GameProvider, useGame } from './context/GameContext';
import Landing from './components/Landing';
import Lobby from './components/Lobby';
import SentenceCollection from './components/SentenceCollection';
import GameRound from './components/GameRound';
import CardReveal from './components/CardReveal';
import RoundResults from './components/RoundResults';
import FinalScores from './components/FinalScores';
import Chat from './components/Chat';

function GameRouter() {
  const { state } = useGame();

  switch (state.screen) {
    case 'landing':
      return <Landing />;
    case 'lobby':
      return <Lobby />;
    case 'collecting_sentences':
      return <SentenceCollection />;
    case 'selecting':
    case 'round_text':
      return <GameRound />;
    case 'revealing':
      return <CardReveal />;
    case 'round_results':
      return <RoundResults />;
    case 'final_scores':
      return <FinalScores />;
    default:
      return <Landing />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
      <Chat />
    </GameProvider>
  );
}
