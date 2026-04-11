import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Card, PlayerInfo, LobbySettings, RoundResult, ScoreEntry, FinalScore, RevealedCard, Screen } from '../types';

// --- State ---

interface GameState {
  screen: Screen;
  connected: boolean;
  playerId: string | null;
  playerName: string;
  lobbyId: string | null;
  isHost: boolean;
  hostId: string | null;
  players: PlayerInfo[];
  settings: LobbySettings;
  hand: Card[];
  jokersRemaining: number;
  // Round
  roundNumber: number;
  totalRounds: number;
  roundText: string;
  selectedCardId: string | null;
  playersReady: number;
  totalPlayers: number;
  // Reveal & Voting
  revealedCards: RevealedCard[];
  votedCardId: string | null;
  // Results
  roundResults: RoundResult[];
  scores: ScoreEntry[];
  finalScores: FinalScore[];
  // Sentences
  sentencesRequested: number;
  sentencesSubmitted: boolean;
  // Error
  error: string | null;
}

const initialState: GameState = {
  screen: 'landing',
  connected: false,
  playerId: null,
  playerName: '',
  lobbyId: null,
  isHost: false,
  hostId: null,
  players: [],
  settings: { totalRounds: 5, sentenceMode: 'random', sentencesPerPlayer: 1, cardSetSize: 120 },
  hand: [],
  jokersRemaining: 3,
  roundNumber: 0,
  totalRounds: 5,
  roundText: '',
  selectedCardId: null,
  playersReady: 0,
  totalPlayers: 0,
  revealedCards: [],
  votedCardId: null,
  roundResults: [],
  scores: [],
  finalScores: [],
  sentencesRequested: 0,
  sentencesSubmitted: false,
  error: null,
};

// --- Actions ---

type Action =
  | { type: 'SET_CONNECTED'; connected: boolean }
  | { type: 'SET_NAME'; name: string }
  | { type: 'LOBBY_CREATED'; lobbyId: string; playerId: string }
  | { type: 'LOBBY_JOINED'; lobbyId: string; playerId: string; players: PlayerInfo[]; hostId: string; settings: LobbySettings }
  | { type: 'PLAYER_JOINED'; player: PlayerInfo }
  | { type: 'PLAYER_LEFT'; playerId: string; newHostId: string | null }
  | { type: 'HOST_CHANGED'; newHostId: string }
  | { type: 'SETTINGS_CHANGED'; settings: LobbySettings }
  | { type: 'GAME_STARTED'; hand: Card[]; state: string }
  | { type: 'REQUEST_SENTENCES'; count: number }
  | { type: 'SENTENCES_SUBMITTED' }
  | { type: 'SENTENCES_COLLECTED'; playersReady: number; totalPlayers: number }
  | { type: 'ROUND_TEXT'; roundNumber: number; totalRounds: number; text: string }
  | { type: 'SELECT_CARD'; cardId: string }
  | { type: 'CARD_SELECTED'; playersReady: number; totalPlayers: number }
  | { type: 'CARD_PLAYED'; hand: Card[]; playersReady: number; totalPlayers: number }
  | { type: 'REVEAL_CARDS'; cards: RevealedCard[] }
  | { type: 'VOTE_CARD'; cardId: string }
  | { type: 'VOTE_RECEIVED'; playersVoted: number; totalPlayers: number }
  | { type: 'ROUND_RESULTS'; roundNumber: number; results: RoundResult[]; scores: ScoreEntry[] }
  | { type: 'DRAW_CARD'; card: Card }
  | { type: 'JOKER_USED'; oldCardId: string; newCard: Card; jokersRemaining: number }
  | { type: 'GAME_ENDED'; finalScores: FinalScore[] }
  | { type: 'PLAYER_DISCONNECTED'; playerId: string }
  | { type: 'PLAYER_RECONNECTED'; playerId: string }
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET' }
  | { type: 'GO_TO_SCREEN'; screen: Screen };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.connected };
    case 'SET_NAME':
      return { ...state, playerName: action.name };
    case 'LOBBY_CREATED':
      return {
        ...state,
        screen: 'lobby',
        lobbyId: action.lobbyId,
        playerId: action.playerId,
        isHost: true,
        hostId: action.playerId,
        players: [{ id: action.playerId, name: state.playerName, score: 0, connected: true }],
      };
    case 'LOBBY_JOINED':
      return {
        ...state,
        screen: 'lobby',
        lobbyId: action.lobbyId,
        playerId: action.playerId,
        isHost: action.hostId === action.playerId,
        hostId: action.hostId,
        players: action.players,
        settings: action.settings,
      };
    case 'PLAYER_JOINED':
      return {
        ...state,
        players: [...state.players, action.player],
      };
    case 'PLAYER_LEFT':
      return {
        ...state,
        players: state.players.filter(p => p.id !== action.playerId),
        hostId: action.newHostId || state.hostId,
        isHost: action.newHostId === state.playerId ? true : state.isHost,
      };
    case 'HOST_CHANGED':
      return {
        ...state,
        hostId: action.newHostId,
        isHost: action.newHostId === state.playerId,
      };
    case 'SETTINGS_CHANGED':
      return { ...state, settings: action.settings };
    case 'GAME_STARTED':
      return {
        ...state,
        hand: action.hand,
        jokersRemaining: 3,
        screen: action.state === 'collecting_sentences' ? 'collecting_sentences' : 'selecting',
      };
    case 'REQUEST_SENTENCES':
      return { ...state, screen: 'collecting_sentences', sentencesRequested: action.count, sentencesSubmitted: false };
    case 'SENTENCES_SUBMITTED':
      return { ...state, sentencesSubmitted: true };
    case 'SENTENCES_COLLECTED':
      return { ...state, playersReady: action.playersReady, totalPlayers: action.totalPlayers };
    case 'ROUND_TEXT':
      return {
        ...state,
        screen: 'selecting',
        roundNumber: action.roundNumber,
        totalRounds: action.totalRounds,
        roundText: action.text,
        selectedCardId: null,
        playersReady: 0,
        revealedCards: [],
        votedCardId: null,
        roundResults: [],
      };
    case 'SELECT_CARD':
      return { ...state, selectedCardId: action.cardId };
    case 'CARD_SELECTED':
      return { ...state, playersReady: action.playersReady, totalPlayers: action.totalPlayers };
    case 'CARD_PLAYED':
      return { ...state, hand: action.hand, playersReady: action.playersReady, totalPlayers: action.totalPlayers };
    case 'REVEAL_CARDS':
      return { ...state, screen: 'revealing', revealedCards: action.cards, playersReady: 0, votedCardId: null };
    case 'VOTE_CARD':
      return { ...state, votedCardId: action.cardId, error: null };
    case 'VOTE_RECEIVED':
      return { ...state, playersReady: action.playersVoted, totalPlayers: action.totalPlayers };
    case 'ROUND_RESULTS':
      return {
        ...state,
        screen: 'round_results',
        roundResults: action.results,
        scores: action.scores,
        roundNumber: action.roundNumber,
      };
    case 'DRAW_CARD':
      return { ...state, hand: [...state.hand, action.card] };
    case 'JOKER_USED':
      return {
        ...state,
        hand: state.hand.filter(c => c.id !== action.oldCardId).concat(action.newCard),
        jokersRemaining: action.jokersRemaining,
      };
    case 'GAME_ENDED':
      return { ...state, screen: 'final_scores', finalScores: action.finalScores };
    case 'PLAYER_DISCONNECTED':
      return {
        ...state,
        players: state.players.map(p => p.id === action.playerId ? { ...p, connected: false } : p),
      };
    case 'PLAYER_RECONNECTED':
      return {
        ...state,
        players: state.players.map(p => p.id === action.playerId ? { ...p, connected: true } : p),
      };
    case 'ERROR':
      return { ...state, error: action.message };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'RESET':
      return { ...initialState, playerName: state.playerName, connected: state.connected };
    case 'GO_TO_SCREEN':
      return { ...state, screen: action.screen };
    default:
      return state;
  }
}

// --- Context ---

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  send: (event: string, data?: Record<string, unknown>) => void;
  connectWs: () => void;
  disconnectWs: () => void;
}

export const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleMessage = useCallback((event: string, data: any) => {
    switch (event) {
      case 'welcome':
        dispatch({ type: 'SET_CONNECTED', connected: true });
        break;
      case 'lobbyCreated':
        dispatch({ type: 'LOBBY_CREATED', lobbyId: data.lobbyId, playerId: data.playerId });
        break;
      case 'lobbyJoined':
        dispatch({
          type: 'LOBBY_JOINED',
          lobbyId: data.lobbyId,
          playerId: data.playerId,
          players: data.players,
          hostId: data.hostId,
          settings: data.settings,
        });
        break;
      case 'playerJoined':
        dispatch({
          type: 'PLAYER_JOINED',
          player: { id: data.playerId, name: data.playerName, score: 0, connected: true },
        });
        break;
      case 'playerLeft':
        dispatch({ type: 'PLAYER_LEFT', playerId: data.playerId, newHostId: data.newHostId });
        break;
      case 'hostChanged':
        dispatch({ type: 'HOST_CHANGED', newHostId: data.newHostId });
        break;
      case 'settingsChanged':
        dispatch({ type: 'SETTINGS_CHANGED', settings: data.settings });
        break;
      case 'gameStarted':
        dispatch({ type: 'GAME_STARTED', hand: data.hand, state: data.state });
        break;
      case 'requestSentences':
        dispatch({ type: 'REQUEST_SENTENCES', count: data.count });
        break;
      case 'sentencesCollected':
        dispatch({ type: 'SENTENCES_COLLECTED', playersReady: data.playersReady, totalPlayers: data.totalPlayers });
        break;
      case 'roundText':
        dispatch({ type: 'ROUND_TEXT', roundNumber: data.roundNumber, totalRounds: data.totalRounds, text: data.text });
        break;
      case 'cardSelected':
        dispatch({ type: 'CARD_SELECTED', playersReady: data.playersReady, totalPlayers: data.totalPlayers });
        break;
      case 'cardPlayed':
        dispatch({ type: 'CARD_PLAYED', hand: data.hand, playersReady: data.playersReady, totalPlayers: data.totalPlayers });
        break;
      case 'revealCards':
        dispatch({ type: 'REVEAL_CARDS', cards: data.cards });
        break;
      case 'voteReceived':
        dispatch({ type: 'VOTE_RECEIVED', playersVoted: data.playersVoted, totalPlayers: data.totalPlayers });
        break;
      case 'roundResults':
        dispatch({ type: 'ROUND_RESULTS', roundNumber: data.roundNumber, results: data.results, scores: data.scores });
        break;
      case 'drawCard':
        dispatch({ type: 'DRAW_CARD', card: data.card });
        break;
      case 'jokerUsed':
        dispatch({ type: 'JOKER_USED', oldCardId: data.oldCardId, newCard: data.newCard, jokersRemaining: data.jokersRemaining });
        break;
      case 'gameEnded':
        dispatch({ type: 'GAME_ENDED', finalScores: data.finalScores });
        break;
      case 'playerDisconnected':
        dispatch({ type: 'PLAYER_DISCONNECTED', playerId: data.playerId });
        break;
      case 'playerReconnected':
        dispatch({ type: 'PLAYER_RECONNECTED', playerId: data.playerId });
        break;
      case 'error':
        dispatch({ type: 'ERROR', message: data.message });
        break;
      case 'pong':
        break;
    }
  }, []);

  const { connect, send, disconnect } = useWebSocket(handleMessage);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return (
    <GameContext.Provider value={{ state, dispatch, send, connectWs: connect, disconnectWs: disconnect }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
