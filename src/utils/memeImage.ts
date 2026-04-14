import type { MemeSet } from '../types';

export function getCardImageSrc(imageIndex: number, memeSet: MemeSet): string {
  if (memeSet === 'spongebob') return `/memes/spongebob/${imageIndex}.jpg`;
  if (memeSet === 'general') return `/memes/general/${imageIndex}.png`;
  // 'all': 0–30 = spongebob, 31+ = general
  return imageIndex <= 30
    ? `/memes/spongebob/${imageIndex}.jpg`
    : `/memes/general/${imageIndex - 31}.png`;
}
