import {
  GameState,
  Player,
  Card,
  LobbyState,
  RoundPhase,
  RoundState,
  LobbySettings,
  SentenceMode,
  MAX_JOKERS_PER_GAME,
  INITIAL_HAND_SIZE,
  DEFAULT_CARD_SET_SIZE,
  DEFAULT_ROUNDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
} from '../types';
import { generateLobbyCode, generatePlayerId } from '../utils/idGenerator';
import { createDeck, dealCards, drawCard, shuffle } from '../utils/deck';
import { pickRandomSentences } from '../utils/defaultSentences';

export class LobbyManager {
  private lobbies: Map<string, GameState> = new Map();

  // --- Lobby lifecycle ---

  createLobby(playerName: string): { lobbyId: string; playerId: string; gameState: GameState } {
    let lobbyId: string;
    do {
      lobbyId = generateLobbyCode();
    } while (this.lobbies.has(lobbyId));

    const playerId = generatePlayerId();
    const player: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      score: 0,
      jokersUsed: 0,
      connected: true,
      selectedCardId: null,
      submittedSentences: [],
      sentencesSubmitted: false,
    };

    const gameState: GameState = {
      lobbyId,
      state: LobbyState.WAITING,
      hostId: playerId,
      settings: {
        totalRounds: DEFAULT_ROUNDS,
        sentenceMode: SentenceMode.RANDOM,
        sentencesPerPlayer: 1,
        cardSetSize: DEFAULT_CARD_SET_SIZE,
      },
      players: new Map([[playerId, player]]),
      drawPile: [],
      sentencePool: [],
      usedSentences: [],
      currentRound: null,
      roundHistory: [],
    };

    this.lobbies.set(lobbyId, gameState);
    return { lobbyId, playerId, gameState };
  }

  joinLobby(lobbyId: string, playerName: string): { playerId: string; gameState: GameState } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (gs.state !== LobbyState.WAITING) throw new Error('Spiel läuft bereits');
    if (gs.players.size >= MAX_PLAYERS) throw new Error('Lobby ist voll');

    // Check for duplicate names
    for (const p of gs.players.values()) {
      if (p.name.toLowerCase() === playerName.toLowerCase()) {
        throw new Error('Name bereits vergeben');
      }
    }

    const playerId = generatePlayerId();
    const player: Player = {
      id: playerId,
      name: playerName,
      hand: [],
      score: 0,
      jokersUsed: 0,
      connected: true,
      selectedCardId: null,
      submittedSentences: [],
      sentencesSubmitted: false,
    };

    gs.players.set(playerId, player);
    return { playerId, gameState: gs };
  }

  leaveLobby(lobbyId: string, playerId: string): { gameState: GameState; removed: boolean; newHostId: string | null } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');

    const player = gs.players.get(playerId);
    if (!player) throw new Error('Spieler nicht in Lobby');

    gs.players.delete(playerId);
    let newHostId: string | null = null;

    if (gs.players.size === 0) {
      this.lobbies.delete(lobbyId);
      return { gameState: gs, removed: true, newHostId: null };
    }

    // Transfer host if needed
    if (gs.hostId === playerId) {
      const firstConnected = [...gs.players.values()].find(p => p.connected);
      if (firstConnected) {
        gs.hostId = firstConnected.id;
        newHostId = firstConnected.id;
      }
    }

    return { gameState: gs, removed: false, newHostId };
  }

  handleDisconnect(lobbyId: string, playerId: string): { gameState: GameState; newHostId: string | null } | null {
    const gs = this.getLobby(lobbyId);
    if (!gs) return null;

    const player = gs.players.get(playerId);
    if (!player) return null;

    player.connected = false;
    let newHostId: string | null = null;

    // If in waiting state, just remove the player
    if (gs.state === LobbyState.WAITING) {
      return this.leaveLobby(lobbyId, playerId);
    }

    // Transfer host if needed
    if (gs.hostId === playerId) {
      const firstConnected = [...gs.players.values()].find(p => p.connected);
      if (firstConnected) {
        gs.hostId = firstConnected.id;
        newHostId = firstConnected.id;
      }
    }

    // If all disconnected during a game, clean up
    const anyConnected = [...gs.players.values()].some(p => p.connected);
    if (!anyConnected) {
      this.lobbies.delete(lobbyId);
      return null;
    }

    return { gameState: gs, newHostId };
  }

  handleReconnect(lobbyId: string, playerId: string): GameState | null {
    const gs = this.getLobby(lobbyId);
    if (!gs) return null;

    const player = gs.players.get(playerId);
    if (!player) return null;

    player.connected = true;
    return gs;
  }

  // --- Settings ---

  updateSettings(lobbyId: string, playerId: string, settings: Partial<LobbySettings>): GameState {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (gs.hostId !== playerId) throw new Error('Nur der Host darf Einstellungen ändern');
    if (gs.state !== LobbyState.WAITING) throw new Error('Einstellungen können nur in der Lobby geändert werden');

    if (settings.totalRounds !== undefined) {
      gs.settings.totalRounds = Math.max(1, Math.min(20, settings.totalRounds));
    }
    if (settings.sentenceMode !== undefined) {
      gs.settings.sentenceMode = settings.sentenceMode;
    }
    if (settings.sentencesPerPlayer !== undefined) {
      gs.settings.sentencesPerPlayer = Math.max(1, Math.min(2, settings.sentencesPerPlayer));
    }
    if (settings.cardSetSize !== undefined) {
      gs.settings.cardSetSize = Math.max(30, Math.min(500, settings.cardSetSize));
    }

    return gs;
  }

  // --- Game start ---

  startGame(lobbyId: string, playerId: string): GameState {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (gs.hostId !== playerId) throw new Error('Nur der Host darf das Spiel starten');
    if (gs.state !== LobbyState.WAITING) throw new Error('Spiel läuft bereits');

    const connectedPlayers = [...gs.players.values()].filter(p => p.connected);
    if (connectedPlayers.length < MIN_PLAYERS) {
      throw new Error(`Mindestens ${MIN_PLAYERS} Spieler benötigt`);
    }

    // Create and shuffle the deck
    gs.drawPile = createDeck(gs.settings.cardSetSize);

    // Deal initial hands
    for (const player of gs.players.values()) {
      player.hand = dealCards(gs.drawPile, INITIAL_HAND_SIZE);
      player.score = 0;
      player.jokersUsed = 0;
      player.selectedCardId = null;
      player.submittedSentences = [];
      player.sentencesSubmitted = false;
    }

    if (gs.settings.sentenceMode === SentenceMode.PLAYER_GENERATED) {
      gs.state = LobbyState.COLLECTING_SENTENCES;
    } else {
      gs.state = LobbyState.PLAYING;
      gs.sentencePool = pickRandomSentences(gs.settings.totalRounds);
    }

    gs.roundHistory = [];
    gs.usedSentences = [];
    gs.currentRound = null;

    return gs;
  }

  // --- Sentence collection ---

  submitSentences(lobbyId: string, playerId: string, sentences: string[]): { gameState: GameState; allSubmitted: boolean } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (gs.state !== LobbyState.COLLECTING_SENTENCES) throw new Error('Sätze werden gerade nicht gesammelt');

    const player = gs.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden');
    if (player.sentencesSubmitted) throw new Error('Sätze bereits eingereicht');

    // Sanitize and limit
    const sanitized = sentences
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length <= 200)
      .slice(0, gs.settings.sentencesPerPlayer);

    player.submittedSentences = sanitized;
    player.sentencesSubmitted = true;

    // Check if all connected players have submitted
    const connectedPlayers = [...gs.players.values()].filter(p => p.connected);
    const allSubmitted = connectedPlayers.every(p => p.sentencesSubmitted);

    if (allSubmitted) {
      // Collect and shuffle all sentences
      const allSentences: string[] = [];
      for (const p of gs.players.values()) {
        allSentences.push(...p.submittedSentences);
      }
      gs.sentencePool = shuffle(allSentences);
      gs.state = LobbyState.PLAYING;
    }

    return { gameState: gs, allSubmitted };
  }

  // --- Round management ---

  startNextRound(lobbyId: string): { gameState: GameState; roundText: string } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (gs.state !== LobbyState.PLAYING) throw new Error('Spiel läuft nicht');

    const roundNumber = gs.roundHistory.length + 1;
    if (roundNumber > gs.settings.totalRounds) {
      throw new Error('Alle Runden gespielt');
    }

    // Pick sentence
    let text: string;
    if (gs.sentencePool.length > 0) {
      text = gs.sentencePool.shift()!;
      gs.usedSentences.push(text);
    } else {
      // Fallback: generate a simple sentence
      text = `Runde ${roundNumber} - Zeig dein bestes Meme!`;
    }

    // Reset player selections
    for (const player of gs.players.values()) {
      player.selectedCardId = null;
    }

    const round: RoundState = {
      roundNumber,
      phase: RoundPhase.SELECTING,
      text,
      playedCards: [],
      revealedCards: [],
      votes: {},
    };

    gs.currentRound = round;
    return { gameState: gs, roundText: text };
  }

  selectCard(lobbyId: string, playerId: string, cardId: string): { gameState: GameState; allSelected: boolean } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (!gs.currentRound) throw new Error('Keine aktive Runde');
    if (gs.currentRound.phase !== RoundPhase.SELECTING) throw new Error('Kartenauswahl nicht aktiv');

    const player = gs.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden');

    // Validate card is in player's hand
    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Karte nicht in deiner Hand');

    // If player already selected, put old card back
    if (player.selectedCardId) {
      const oldEntry = gs.currentRound.playedCards.find(pc => pc.playerId === playerId);
      if (oldEntry) {
        player.hand.push(oldEntry.card);
        gs.currentRound.playedCards = gs.currentRound.playedCards.filter(pc => pc.playerId !== playerId);
      }
    }

    // Remove card from hand and add to played
    const [card] = player.hand.splice(cardIndex, 1);
    player.selectedCardId = cardId;
    gs.currentRound.playedCards.push({ playerId, card });

    // Check if all connected players have selected
    const connectedPlayers = [...gs.players.values()].filter(p => p.connected);
    const allSelected = connectedPlayers.every(p => p.selectedCardId !== null);

    if (allSelected) {
      gs.currentRound.phase = RoundPhase.REVEALING;
      // Shuffle the played cards for anonymous reveal
      gs.currentRound.revealedCards = shuffle([...gs.currentRound.playedCards]);
    }

    return { gameState: gs, allSelected };
  }

  vote(lobbyId: string, playerId: string, cardId: string): { gameState: GameState; allVoted: boolean } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (!gs.currentRound) throw new Error('Keine aktive Runde');
    if (gs.currentRound.phase !== RoundPhase.REVEALING) throw new Error('Abstimmung nicht aktiv');

    const player = gs.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden');

    // Debug: Log played cards
    console.log(`[VOTE] Player ${player.name} voting on card ${cardId}. PlayedCards:`,
      gs.currentRound.playedCards.map(pc => `${pc.playerId}(${pc.card.id})`).join(', '));

    // Can't vote for your own card
    const ownCard = gs.currentRound.playedCards.find(pc => pc.playerId === playerId);
    console.log(`[VOTE] Own card check: ownCard=${ownCard ? ownCard.card.id : 'none'}, votingFor=${cardId}, isOwn=${ownCard && ownCard.card.id === cardId}`);

    if (ownCard && ownCard.card.id === cardId) {
      throw new Error('Du kannst nicht für deine eigene Karte stimmen');
    }

    // Validate card exists in played cards
    const validCard = gs.currentRound.playedCards.find(pc => pc.card.id === cardId);
    if (!validCard) throw new Error('Ungültige Karte');

    gs.currentRound.votes[playerId] = cardId;

    const connectedPlayers = [...gs.players.values()].filter(p => p.connected);
    const allVoted = connectedPlayers.every(p => gs.currentRound!.votes[p.id] !== undefined);

    if (allVoted) {
      gs.currentRound.phase = RoundPhase.RESULTS;
    }

    return { gameState: gs, allVoted };
  }

  calculateRoundResults(lobbyId: string): {
    results: { playerId: string; playerName: string; cardId: string; imageIndex: number; votes: number; pointsEarned: number }[];
    scores: { playerId: string; playerName: string; score: number }[];
  } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (!gs.currentRound) throw new Error('Keine aktive Runde');

    // Count votes per card
    const voteCounts: Record<string, number> = {};
    for (const cardId of Object.values(gs.currentRound.votes)) {
      voteCounts[cardId] = (voteCounts[cardId] || 0) + 1;
    }

    // Calculate points and build results
    const results = gs.currentRound.playedCards.map(({ playerId, card }) => {
      const player = gs.players.get(playerId)!;
      const votes = voteCounts[card.id] || 0;
      const pointsEarned = votes; // 1 point per vote
      player.score += pointsEarned;

      return {
        playerId,
        playerName: player.name,
        cardId: card.id,
        imageIndex: card.imageIndex,
        votes,
        pointsEarned,
      };
    });

    // Sort by votes descending
    results.sort((a, b) => b.votes - a.votes);

    const scores = [...gs.players.values()]
      .map(p => ({ playerId: p.id, playerName: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);

    return { results, scores };
  }

  drawCardsForAllPlayers(lobbyId: string): Map<string, Card | null> {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');

    const drawn = new Map<string, Card | null>();
    for (const player of gs.players.values()) {
      if (player.connected) {
        const card = drawCard(gs.drawPile);
        if (card) {
          player.hand.push(card);
        }
        drawn.set(player.id, card);
      }
    }
    return drawn;
  }

  finishRound(lobbyId: string): { isLastRound: boolean } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (!gs.currentRound) throw new Error('Keine aktive Runde');

    gs.roundHistory.push(gs.currentRound);
    const isLastRound = gs.roundHistory.length >= gs.settings.totalRounds;

    if (isLastRound) {
      gs.state = LobbyState.FINISHED;
    }

    gs.currentRound = null;
    return { isLastRound };
  }

  // --- Joker ---

  useJoker(lobbyId: string, playerId: string, cardId: string): { oldCard: Card; newCard: Card; jokersRemaining: number } {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');
    if (gs.state !== LobbyState.PLAYING) throw new Error('Spiel läuft nicht');

    const player = gs.players.get(playerId);
    if (!player) throw new Error('Spieler nicht gefunden');
    if (player.jokersUsed >= MAX_JOKERS_PER_GAME) throw new Error('Keine Joker mehr übrig');

    const cardIndex = player.hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error('Karte nicht in deiner Hand');

    const newCard = drawCard(gs.drawPile);
    if (!newCard) throw new Error('Keine Karten mehr im Stapel');

    const [oldCard] = player.hand.splice(cardIndex, 1);
    // Put old card at bottom of draw pile
    gs.drawPile.push(oldCard);
    player.hand.push(newCard);
    player.jokersUsed++;

    return {
      oldCard,
      newCard,
      jokersRemaining: MAX_JOKERS_PER_GAME - player.jokersUsed,
    };
  }

  // --- Final scores ---

  getFinalScores(lobbyId: string): { playerId: string; playerName: string; score: number; rank: number }[] {
    const gs = this.getLobby(lobbyId);
    if (!gs) throw new Error('Lobby nicht gefunden');

    const sorted = [...gs.players.values()]
      .map(p => ({ playerId: p.id, playerName: p.name, score: p.score }))
      .sort((a, b) => b.score - a.score);

    return sorted.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
  }

  // --- Helpers ---

  getLobby(lobbyId: string): GameState | undefined {
    return this.lobbies.get(lobbyId);
  }

  getPlayerList(gs: GameState): { id: string; name: string; score: number; connected: boolean }[] {
    return [...gs.players.values()].map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      connected: p.connected,
    }));
  }

  getConnectedPlayerCount(gs: GameState): number {
    return [...gs.players.values()].filter(p => p.connected).length;
  }

  getSentenceSubmissionStatus(gs: GameState): { playersReady: number; totalPlayers: number } {
    const connected = [...gs.players.values()].filter(p => p.connected);
    return {
      playersReady: connected.filter(p => p.sentencesSubmitted).length,
      totalPlayers: connected.length,
    };
  }

  deleteLobby(lobbyId: string): void {
    this.lobbies.delete(lobbyId);
  }

  getLobbyCount(): number {
    return this.lobbies.size;
  }
}
