import { Card } from '../types';
import { generateCardId } from './idGenerator';

/**
 * Fisher-Yates shuffle (in-place).
 */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Creates a full deck of cards with the given size.
 * Each card maps to an imageIndex that the client uses to display the image.
 */
export function createDeck(size: number): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < size; i++) {
    deck.push({
      id: generateCardId(i),
      imageIndex: i,
    });
  }
  return shuffle(deck);
}

/**
 * Deals `count` cards from the draw pile.
 * Returns the dealt cards and mutates the drawPile in place.
 */
export function dealCards(drawPile: Card[], count: number): Card[] {
  return drawPile.splice(0, Math.min(count, drawPile.length));
}

/**
 * Draws a single card from the draw pile.
 */
export function drawCard(drawPile: Card[]): Card | null {
  return drawPile.length > 0 ? drawPile.shift()! : null;
}
