// ============================================================
// Core Types & Interfaces for the Meme Card Game
// ============================================================

// --- Enums ---

export enum LobbyState {
  WAITING = 'waiting',
  COLLECTING_SENTENCES = 'collecting_sentences',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export enum RoundPhase {
  SHOW_TEXT = 'show_text',
  SELECTING = 'selecting',
  REVEALING = 'revealing',
  VOTING = 'voting',
  RESULTS = 'results',
}

export enum SentenceMode {
  RANDOM = 'random',
  PLAYER_GENERATED = 'player_generated',
}

// --- Card ---

export interface Card {
  id: string;          // unique card ID (e.g. "card_042")
  imageIndex: number;  // index into the client-side image array
}

// --- Player ---

export interface Player {
  id: string;
  name: string;
  hand: Card[];
  score: number;
  jokersUsed: number;
  connected: boolean;
  selectedCardId: string | null;   // card chosen this round
  submittedSentences: string[];    // player-generated sentences
  sentencesSubmitted: boolean;
}

// --- Meme Set ---

export type MemeSet = 'spongebob' | 'general' | 'all';

export const MEME_SET_SIZES: Record<MemeSet, number> = {
  spongebob: 31,
  general: 40,
  all: 71,
};

// --- Lobby Settings ---

export interface LobbySettings {
  totalRounds: number;
  sentenceMode: SentenceMode;
  sentencesPerPlayer: number;  // 1 or 2
  cardSetSize: number;         // total unique cards available (auto from memeSet)
  memeSet: MemeSet;
}

// --- Round State ---

export interface RoundState {
  roundNumber: number;
  phase: RoundPhase;
  text: string;
  playedCards: { playerId: string; card: Card }[];
  revealedCards: { playerId: string; card: Card }[];
  votes: Record<string, string>;  // voterId -> cardId
  reactions: Record<string, Record<string, string>>;  // cardId -> { playerId: emoji }
}

// --- Game State ---

export interface GameState {
  lobbyId: string;
  state: LobbyState;
  hostId: string;
  settings: LobbySettings;
  players: Map<string, Player>;
  drawPile: Card[];
  sentencePool: string[];
  usedSentences: string[];
  currentRound: RoundState | null;
  roundHistory: RoundState[];
}

// ============================================================
// WebSocket Event Payloads (Client → Server)
// ============================================================

export interface C2S_JoinLobby {
  lobbyId: string;
  playerName: string;
}

export interface C2S_CreateLobby {
  playerName: string;
}

export interface C2S_LeaveLobby {
  lobbyId: string;
}

export interface C2S_HostSettings {
  lobbyId: string;
  settings: Partial<LobbySettings>;
}

export interface C2S_StartGame {
  lobbyId: string;
}

export interface C2S_SubmitSentences {
  lobbyId: string;
  sentences: string[];
}

export interface C2S_SelectCard {
  lobbyId: string;
  cardId: string;
}

export interface C2S_UseJoker {
  lobbyId: string;
  cardId: string; // card to discard from hand
}

export interface C2S_Vote {
  lobbyId: string;
  cardId: string; // voted card
}

export interface C2S_NextRound {
  lobbyId: string;
}

// ============================================================
// WebSocket Event Payloads (Server → Client)
// ============================================================

export interface S2C_Error {
  message: string;
}

export interface S2C_LobbyCreated {
  lobbyId: string;
  playerId: string;
}

export interface S2C_LobbyJoined {
  lobbyId: string;
  playerId: string;
  players: { id: string; name: string; score: number; connected: boolean }[];
  hostId: string;
  settings: LobbySettings;
  state: LobbyState;
}

export interface S2C_PlayerJoined {
  playerId: string;
  playerName: string;
}

export interface S2C_PlayerLeft {
  playerId: string;
  playerName: string;
  newHostId: string | null;
}

export interface S2C_SettingsChanged {
  settings: LobbySettings;
}

export interface S2C_GameStarted {
  hand: Card[];
  state: LobbyState;
}

export interface S2C_RequestSentences {
  count: number; // how many sentences to write
}

export interface S2C_SentencesCollected {
  totalSentences: number;
  playersReady: number;
  totalPlayers: number;
}

export interface S2C_RoundText {
  roundNumber: number;
  totalRounds: number;
  text: string;
}

export interface S2C_CardSelected {
  playerId: string;
  playersReady: number;
  totalPlayers: number;
}

export interface S2C_CardPlayed {
  playerId: string;
  hand: Card[];
  playersReady: number;
  totalPlayers: number;
}

export interface S2C_RevealCards {
  cards: { cardId: string; imageIndex: number; playerId: string }[];
}

export interface S2C_VoteReceived {
  playersVoted: number;
  totalPlayers: number;
}

export interface S2C_RoundResults {
  roundNumber: number;
  results: { playerId: string; playerName: string; cardId: string; imageIndex: number; votes: number; pointsEarned: number; reactionBonus: number; reactions: Record<string, number> }[];
  scores: { playerId: string; playerName: string; score: number }[];
}

export interface C2S_SendReaction {
  lobbyId: string;
  cardId: string;
  emoji: string;
}

export interface S2C_ReactionReceived {
  cardId: string;
  emoji: string;
  reactions: Record<string, Record<string, number>>;  // cardId -> { emoji: count }
}

export interface S2C_DrawCard {
  card: Card;
}

export interface S2C_JokerUsed {
  oldCardId: string;
  newCard: Card;
  jokersRemaining: number;
}

export interface S2C_GameEnded {
  finalScores: { playerId: string; playerName: string; score: number; rank: number }[];
}

export interface S2C_HostChanged {
  newHostId: string;
  newHostName: string;
}

export interface S2C_PlayerDisconnected {
  playerId: string;
  playerName: string;
}

export interface S2C_PlayerReconnected {
  playerId: string;
  playerName: string;
}

// ============================================================
// Chat
// ============================================================

export interface C2S_SendChatMessage {
  lobbyId: string;
  text: string;
}

export interface S2C_ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number; // server-assigned via Date.now()
}

// ============================================================
// Master Event Map
// ============================================================

export type ClientEvent =
  | { event: 'createLobby'; data: C2S_CreateLobby }
  | { event: 'joinLobby'; data: C2S_JoinLobby }
  | { event: 'leaveLobby'; data: C2S_LeaveLobby }
  | { event: 'hostSettings'; data: C2S_HostSettings }
  | { event: 'startGame'; data: C2S_StartGame }
  | { event: 'submitSentences'; data: C2S_SubmitSentences }
  | { event: 'selectCard'; data: C2S_SelectCard }
  | { event: 'useJoker'; data: C2S_UseJoker }
  | { event: 'vote'; data: C2S_Vote }
  | { event: 'nextRound'; data: C2S_NextRound }
  | { event: 'sendChatMessage'; data: C2S_SendChatMessage }
  | { event: 'sendReaction'; data: C2S_SendReaction };

export type ServerEvent = { event: string; data: unknown };

// ============================================================
// Constants
// ============================================================

export const MAX_JOKERS_PER_GAME = 3;
export const INITIAL_HAND_SIZE = 6;
export const DEFAULT_CARD_SET_SIZE = 120;
export const DEFAULT_ROUNDS = 5;
export const MAX_PLAYERS = 10;
export const MIN_PLAYERS = 2;
