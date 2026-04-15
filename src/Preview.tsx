/**
 * Dev-only preview page — renders each screen with mock state.
 * Access via: http://localhost:3001/?preview=lobby
 * Used by screenshot.mjs for visual regression testing.
 */
import Lobby from './components/Lobby';
import CardReveal from './components/CardReveal';
import RoundResults from './components/RoundResults';
import GameRound from './components/GameRound';
import Chat from './components/Chat';
import { GameContext } from './context/GameContext';

// ── Shared mock helpers ──────────────────────────────────────────────────────
const mockPlayers = [
  { id: 'p1', name: 'ddd', score: 30, connected: true },
  { id: 'p2', name: '8H97LS', score: 20, connected: true },
  { id: 'p3', name: 'Player 3', score: 10, connected: false },
];
const mockSettings = { totalRounds: 8, sentenceMode: 'random' as const, sentencesPerPlayer: 1, cardSetSize: 31, memeSet: 'spongebob' as const };

function noop() {}
const mockSend: any = noop;
const mockDispatch: any = noop;

function mockCtx(partial: any) {
  const base = {
    screen: 'landing' as any,
    connected: true,
    playerId: 'p1',
    playerName: 'ddd',
    lobbyId: 'ABC123',
    isHost: true,
    hostId: 'p1',
    players: mockPlayers,
    settings: mockSettings,
    hand: [
      { id: 'c1', imageIndex: 0 },
      { id: 'c2', imageIndex: 1 },
      { id: 'c3', imageIndex: 2 },
      { id: 'c4', imageIndex: 3 },
      { id: 'c5', imageIndex: 4 },
      { id: 'c6', imageIndex: 5 },
    ],
    jokersRemaining: 3,
    roundNumber: 3,
    totalRounds: 8,
    roundText: 'Wenn der Chef einen Fehler macht...',
    selectedCardId: null,
    playersReady: 3,
    totalPlayers: 5,
    revealedCards: [
      { cardId: 'rc1', imageIndex: 0 },
      { cardId: 'rc2', imageIndex: 1 },
      { cardId: 'rc3', imageIndex: 2 },
      { cardId: 'rc4', imageIndex: 3 },
      { cardId: 'rc5', imageIndex: 4 },
    ],
    votedCardId: null,
    roundResults: [
      { cardId: 'rc1', imageIndex: 0, playerName: 'ddd', votes: 3, pointsEarned: 30 },
      { cardId: 'rc2', imageIndex: 1, playerName: '8H97LS', votes: 2, pointsEarned: 20 },
      { cardId: 'rc3', imageIndex: 2, playerName: 'Player 3', votes: 1, pointsEarned: 10 },
    ],
    scores: [],
    finalScores: [],
    sentencesRequested: 0,
    sentencesSubmitted: false,
    error: null,
    chatMessages: [],
    ...partial,
  };
  return { state: base, send: mockSend, dispatch: mockDispatch };
}

// ── Screen previews ──────────────────────────────────────────────────────────

function PreviewLobby() {
  return (
    <GameContext.Provider value={mockCtx({ screen: 'lobby' }) as any}>
      <Lobby />
      <Chat />
    </GameContext.Provider>
  );
}

function PreviewCardReveal() {
  return (
    <GameContext.Provider value={mockCtx({ screen: 'revealing' }) as any}>
      <CardReveal />
      <Chat />
    </GameContext.Provider>
  );
}

function PreviewRoundResults() {
  return (
    <GameContext.Provider value={mockCtx({ screen: 'round_results' }) as any}>
      <RoundResults />
      <Chat />
    </GameContext.Provider>
  );
}

function PreviewGameRound() {
  return (
    <GameContext.Provider value={mockCtx({ screen: 'selecting' }) as any}>
      <GameRound />
      <Chat />
    </GameContext.Provider>
  );
}

// ── Router ───────────────────────────────────────────────────────────────────

export default function Preview() {
  const screen = new URLSearchParams(window.location.search).get('preview');
  switch (screen) {
    case 'lobby':        return <PreviewLobby />;
    case 'card_reveal':  return <PreviewCardReveal />;
    case 'round_results':return <PreviewRoundResults />;
    case 'game_round':   return <PreviewGameRound />;
    default:
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#111', color: '#fff', minHeight: '100vh' }}>
          <h2>Preview routes:</h2>
          <ul>
            {['lobby','card_reveal','round_results','game_round'].map(s => (
              <li key={s}><a href={`?preview=${s}`} style={{ color: '#d4a020' }}>?preview={s}</a></li>
            ))}
          </ul>
        </div>
      );
  }
}
