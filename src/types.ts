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

export interface LobbySettings {
  totalRounds: number;
  sentenceMode: 'random' | 'player_generated';
  sentencesPerPlayer: number;
  cardSetSize: number;
}

export interface RoundResult {
  playerId: string;
  playerName: string;
  cardId: string;
  imageIndex: number;
  votes: number;
  pointsEarned: number;
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
