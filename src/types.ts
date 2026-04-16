// Shared types mirrored from server

export interface Card {
  id: string;
  imageIndex: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  score: number;
  connected: boolean;
}

export type MemeSet = 'spongebob' | 'general' | 'all';

export const MEME_SET_SIZES: Record<MemeSet, number> = {
  spongebob: 31,
  general: 40,
  all: 71,
};

export interface LobbySettings {
  totalRounds: number;
  sentenceMode: 'random' | 'player_generated';
  sentencesPerPlayer: number;
  cardSetSize: number;
  memeSet: MemeSet;
}

export interface RoundResult {
  playerId: string;
  playerName: string;
  cardId: string;
  imageIndex: number;
  votes: number;
  pointsEarned: number;
  reactionBonus: number;
  reactions: Record<string, number>;  // emoji -> count
}

export interface ScoreEntry {
  playerId: string;
  playerName: string;
  score: number;
}

export interface FinalScore {
  playerId: string;
  playerName: string;
  score: number;
  rank: number;
}

export interface RevealedCard {
  cardId: string;
  imageIndex: number;
  playerId: string;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

// Game screen states
export type Screen =
  | 'landing'
  | 'lobby'
  | 'collecting_sentences'
  | 'round_text'
  | 'selecting'
  | 'revealing'
  | 'round_results'
  | 'final_scores';
