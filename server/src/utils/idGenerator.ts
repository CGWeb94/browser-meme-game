import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a short, human-readable lobby code (6 uppercase chars).
 */
export function generateLobbyCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Generate a unique player ID.
 */
export function generatePlayerId(): string {
  return `p_${uuidv4().slice(0, 8)}`;
}

/**
 * Generate a unique card ID.
 */
export function generateCardId(index: number): string {
  return `card_${index.toString().padStart(3, '0')}`;
}
