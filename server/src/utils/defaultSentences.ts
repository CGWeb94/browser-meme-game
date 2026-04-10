/**
 * Default round sentences for "random" sentence mode.
 * The server picks from these when SentenceMode.RANDOM is selected.
 */
export const DEFAULT_SENTENCES: string[] = [
  'Wenn der Chef fragt, warum du zu spät bist...',
  'Mein Gesicht, wenn Montag ist',
  'Wenn du merkst, dass morgen Mathearbeit ist',
  'Wie ich mich nach 5 Minuten Sport fühle',
  'Wenn jemand sagt: "Wir müssen reden"',
  'Mein innerer Zustand um 3 Uhr nachts',
  'Wenn das WLAN nicht funktioniert',
  'Wenn die Pizza endlich da ist',
  'Wie ich im Meeting aussehe vs. was ich denke',
  'Wenn du dein Handy im Dunkeln findest',
  'Mein Gesicht bei der Gehaltsabrechnung',
  'Wenn jemand dein Essen aus dem Kühlschrank nimmt',
  'Wie ich tanze, wenn niemand zuschaut',
  'Wenn du realisierst, dass Sonntag schon wieder vorbei ist',
  'Mein Blick, wenn jemand Spoiler erzählt',
  'Wenn das Update 3 Stunden dauert',
  'Wie ich mich fühle, nachdem ich 10 Stunden gezockt habe',
  'Wenn du merkst, dass du die falsche Gruppe angeschrieben hast',
  'Mein Gesicht, wenn ich meinen eigenen Witz lustig finde',
  'Wenn der Lehrer sagt: "Die Klausur war einfach"',
  'Wie ich aussehe, wenn ich Selfies mache',
  'Wenn Freitagnachmittag endlich da ist',
  'Mein Zustand nach der dritten Tasse Kaffee',
  'Wenn du im Supermarkt jemanden aus der Schule triffst',
  'Wie ich versuche, erwachsen zu sein',
  'Wenn jemand sagt, er mag keine Memes',
  'Mein Gesicht beim Zahnarzt',
  'Wenn du merkst, dass du den ganzen Tag Jogginghose trägst',
  'Wie ich auf unangenehme Fragen reagiere',
  'Wenn der letzte Bus weg ist',
  'Mein Blick, wenn jemand mein Handy nimmt',
  'Wenn du versuchst, cool zu sein, und es schiefgeht',
  'Wie ich mich fühle, wenn ich den Code endlich zum Laufen bringe',
  'Wenn du realisierst, dass du 47 Tabs offen hast',
  'Mein Gesicht, wenn der Wecker um 6 Uhr klingelt',
  'Wenn du ein Like von deinem Crush bekommst',
  'Wie ich versuche, ein Kompliment anzunehmen',
  'Wenn das Essen zu scharf ist, aber du es nicht zugeben willst',
  'Mein innerer Zustand bei der Steuererklärung',
  'Wenn du merkst, dass du laut gedacht hast',
];

/**
 * Picks `count` random unique sentences from the default pool.
 */
export function pickRandomSentences(count: number): string[] {
  const shuffled = [...DEFAULT_SENTENCES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
