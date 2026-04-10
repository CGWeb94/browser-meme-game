import WebSocket from 'ws';
import { LobbyManager } from '../models/LobbyManager';
import { ConnectionHandler } from './connectionHandler';
import {
  LobbyState,
  SentenceMode,
  S2C_LobbyCreated,
  S2C_LobbyJoined,
  S2C_PlayerJoined,
  S2C_PlayerLeft,
  S2C_SettingsChanged,
  S2C_GameStarted,
  S2C_RequestSentences,
  S2C_SentencesCollected,
  S2C_RoundText,
  S2C_CardSelected,
  S2C_RevealCards,
  S2C_VoteReceived,
  S2C_RoundResults,
  S2C_DrawCard,
  S2C_JokerUsed,
  S2C_GameEnded,
  S2C_HostChanged,
  S2C_PlayerDisconnected,
  S2C_PlayerReconnected,
} from '../types';

export class GameHandler {
  constructor(
    private lobby: LobbyManager,
    private conn: ConnectionHandler,
  ) {}

  // --- Lobby Events ---

  handleCreateLobby(ws: WebSocket, data: { playerName: string }): void {
    try {
      const { playerName } = data;
      if (!playerName || playerName.trim().length === 0) {
        this.conn.sendError(ws, 'Name darf nicht leer sein');
        return;
      }

      const { lobbyId, playerId, gameState } = this.lobby.createLobby(playerName.trim());
      this.conn.register(ws, playerId, lobbyId);

      const payload: S2C_LobbyCreated = { lobbyId, playerId };
      this.conn.sendTo(playerId, 'lobbyCreated', payload);
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  handleJoinLobby(ws: WebSocket, data: { lobbyId: string; playerName: string }): void {
    try {
      const { lobbyId, playerName } = data;
      if (!playerName || playerName.trim().length === 0) {
        this.conn.sendError(ws, 'Name darf nicht leer sein');
        return;
      }
      if (!lobbyId) {
        this.conn.sendError(ws, 'Lobby-Code fehlt');
        return;
      }

      const { playerId, gameState } = this.lobby.joinLobby(lobbyId.toUpperCase(), playerName.trim());
      this.conn.register(ws, playerId, lobbyId.toUpperCase());

      // Send full lobby state to the joining player
      const joinedPayload: S2C_LobbyJoined = {
        lobbyId: gameState.lobbyId,
        playerId,
        players: this.lobby.getPlayerList(gameState),
        hostId: gameState.hostId,
        settings: gameState.settings,
        state: gameState.state,
      };
      this.conn.sendTo(playerId, 'lobbyJoined', joinedPayload);

      // Notify others
      const joinedNotify: S2C_PlayerJoined = {
        playerId,
        playerName: playerName.trim(),
      };
      this.conn.broadcastToLobby(lobbyId.toUpperCase(), 'playerJoined', joinedNotify, playerId);
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  handleLeaveLobby(ws: WebSocket, data: { lobbyId: string }): void {
    try {
      const meta = this.conn.getMeta(ws);
      if (!meta) return;

      const { gameState, removed, newHostId } = this.lobby.leaveLobby(meta.lobbyId, meta.playerId);
      const player = gameState.players.get(meta.playerId);

      this.conn.unregister(ws);

      if (!removed) {
        const payload: S2C_PlayerLeft = {
          playerId: meta.playerId,
          playerName: player?.name || 'Unbekannt',
          newHostId,
        };
        this.conn.broadcastToLobby(meta.lobbyId, 'playerLeft', payload);

        if (newHostId) {
          const newHost = gameState.players.get(newHostId);
          const hostPayload: S2C_HostChanged = {
            newHostId,
            newHostName: newHost?.name || 'Unbekannt',
          };
          this.conn.broadcastToLobby(meta.lobbyId, 'hostChanged', hostPayload);
        }
      }
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  handleDisconnect(ws: WebSocket): void {
    const meta = this.conn.getMeta(ws);
    if (!meta) {
      this.conn.unregister(ws);
      return;
    }

    const gs = this.lobby.getLobby(meta.lobbyId);
    const playerName = gs?.players.get(meta.playerId)?.name || 'Unbekannt';

    const result = this.lobby.handleDisconnect(meta.lobbyId, meta.playerId);
    this.conn.unregister(ws);

    if (result) {
      const payload: S2C_PlayerDisconnected = {
        playerId: meta.playerId,
        playerName,
      };
      this.conn.broadcastToLobby(meta.lobbyId, 'playerDisconnected', payload);

      if (result.newHostId) {
        const newHost = result.gameState.players.get(result.newHostId);
        const hostPayload: S2C_HostChanged = {
          newHostId: result.newHostId,
          newHostName: newHost?.name || 'Unbekannt',
        };
        this.conn.broadcastToLobby(meta.lobbyId, 'hostChanged', hostPayload);
      }

      // During card selection, check if all remaining connected players have selected
      if (result.gameState.currentRound?.phase === 'selecting') {
        this.checkAutoAdvance(meta.lobbyId);
      }
    }
  }

  handleHostSettings(ws: WebSocket, data: { lobbyId: string; settings: any }): void {
    try {
      const meta = this.conn.getMeta(ws);
      if (!meta) return;

      const gameState = this.lobby.updateSettings(data.lobbyId, meta.playerId, data.settings);
      const payload: S2C_SettingsChanged = { settings: gameState.settings };
      this.conn.broadcastToLobby(data.lobbyId, 'settingsChanged', payload);
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  // --- Game Start ---

  handleStartGame(ws: WebSocket, data: { lobbyId: string }): void {
    try {
      const meta = this.conn.getMeta(ws);
      if (!meta) return;

      const gameState = this.lobby.startGame(data.lobbyId, meta.playerId);

      // Send each player their hand
      for (const player of gameState.players.values()) {
        const payload: S2C_GameStarted = {
          hand: player.hand,
          state: gameState.state,
        };
        this.conn.sendTo(player.id, 'gameStarted', payload);
      }

      // If player-generated sentence mode, request sentences
      if (gameState.state === LobbyState.COLLECTING_SENTENCES) {
        const reqPayload: S2C_RequestSentences = {
          count: gameState.settings.sentencesPerPlayer,
        };
        this.conn.broadcastToLobby(data.lobbyId, 'requestSentences', reqPayload);
      } else {
        // Auto-start first round
        this.startRound(data.lobbyId);
      }
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  // --- Sentence Collection ---

  handleSubmitSentences(ws: WebSocket, data: { lobbyId: string; sentences: string[] }): void {
    try {
      const meta = this.conn.getMeta(ws);
      if (!meta) return;

      const { gameState, allSubmitted } = this.lobby.submitSentences(data.lobbyId, meta.playerId, data.sentences);

      // Broadcast progress
      const status = this.lobby.getSentenceSubmissionStatus(gameState);
      const progressPayload: S2C_SentencesCollected = {
        totalSentences: gameState.sentencePool.length + data.sentences.length,
        playersReady: status.playersReady,
        totalPlayers: status.totalPlayers,
      };
      this.conn.broadcastToLobby(data.lobbyId, 'sentencesCollected', progressPayload);

      if (allSubmitted) {
        // Start first round
        this.startRound(data.lobbyId);
      }
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  // --- Card Selection ---

  handleSelectCard(ws: WebSocket, data: { lobbyId: string; cardId: string }): void {
    try {
      const meta = this.conn.getMeta(ws);
      if (!meta) return;

      const { gameState, allSelected } = this.lobby.selectCard(data.lobbyId, meta.playerId, data.cardId);

      // Notify all players about progress (without revealing who chose what)
      const connectedCount = this.lobby.getConnectedPlayerCount(gameState);
      const selectedCount = [...gameState.players.values()].filter(p => p.connected && p.selectedCardId !== null).length;

      const progressPayload: S2C_CardSelected = {
        playerId: meta.playerId,
        playersReady: selectedCount,
        totalPlayers: connectedCount,
      };
      this.conn.broadcastToLobby(data.lobbyId, 'cardSelected', progressPayload);

      if (allSelected) {
        this.revealCards(data.lobbyId);
      }
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  // --- Voting ---

  handleVote(ws: WebSocket, data: { lobbyId: string; cardId: string }): void {
    try {
      const meta = this.conn.getMeta(ws);
      if (!meta) return;

      const { gameState, allVoted } = this.lobby.vote(data.lobbyId, meta.playerId, data.cardId);

      const connectedCount = this.lobby.getConnectedPlayerCount(gameState);
      const votedCount = Object.keys(gameState.currentRound!.votes).length;

      const progressPayload: S2C_VoteReceived = {
        playersVoted: votedCount,
        totalPlayers: connectedCount,
      };
      this.conn.broadcastToLobby(data.lobbyId, 'voteReceived', progressPayload);

      if (allVoted) {
        this.showRoundResults(data.lobbyId);
      }
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  // --- Joker ---

  handleUseJoker(ws: WebSocket, data: { lobbyId: string; cardId: string }): void {
    try {
      const meta = this.conn.getMeta(ws);
      if (!meta) return;

      const { oldCard, newCard, jokersRemaining } = this.lobby.useJoker(data.lobbyId, meta.playerId, data.cardId);

      const payload: S2C_JokerUsed = {
        oldCardId: oldCard.id,
        newCard,
        jokersRemaining,
      };
      this.conn.sendTo(meta.playerId, 'jokerUsed', payload);
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  // --- Next Round / End ---

  handleNextRound(ws: WebSocket, data: { lobbyId: string }): void {
    try {
      const meta = this.conn.getMeta(ws);
      if (!meta) return;

      const gs = this.lobby.getLobby(data.lobbyId);
      if (!gs) throw new Error('Lobby nicht gefunden');
      if (gs.hostId !== meta.playerId) throw new Error('Nur der Host kann die nächste Runde starten');

      this.startRound(data.lobbyId);
    } catch (err: any) {
      this.conn.sendError(ws, err.message);
    }
  }

  // --- Internal helpers ---

  private startRound(lobbyId: string): void {
    try {
      const { gameState, roundText } = this.lobby.startNextRound(lobbyId);

      const payload: S2C_RoundText = {
        roundNumber: gameState.currentRound!.roundNumber,
        totalRounds: gameState.settings.totalRounds,
        text: roundText,
      };
      this.conn.broadcastToLobby(lobbyId, 'roundText', payload);
    } catch (err: any) {
      // If all rounds are done, end game
      const gs = this.lobby.getLobby(lobbyId);
      if (gs && gs.roundHistory.length >= gs.settings.totalRounds) {
        this.endGame(lobbyId);
      }
    }
  }

  private revealCards(lobbyId: string): void {
    const gs = this.lobby.getLobby(lobbyId);
    if (!gs || !gs.currentRound) return;

    const payload: S2C_RevealCards = {
      cards: gs.currentRound.revealedCards.map(({ playerId, card }) => ({
        cardId: card.id,
        imageIndex: card.imageIndex,
        playerId, // will be revealed after voting
      })),
    };

    // Don't reveal playerId to clients yet — send without it for anonymous voting
    const anonymousPayload: S2C_RevealCards = {
      cards: gs.currentRound.revealedCards.map(({ card }) => ({
        cardId: card.id,
        imageIndex: card.imageIndex,
        playerId: '', // hidden during voting
      })),
    };

    this.conn.broadcastToLobby(lobbyId, 'revealCards', anonymousPayload);
  }

  private showRoundResults(lobbyId: string): void {
    const { results, scores } = this.lobby.calculateRoundResults(lobbyId);
    const gs = this.lobby.getLobby(lobbyId);
    if (!gs || !gs.currentRound) return;

    const payload: S2C_RoundResults = {
      roundNumber: gs.currentRound.roundNumber,
      results,
      scores,
    };
    this.conn.broadcastToLobby(lobbyId, 'roundResults', payload);

    // Draw cards for all players
    const drawnCards = this.lobby.drawCardsForAllPlayers(lobbyId);
    for (const [playerId, card] of drawnCards) {
      if (card) {
        const drawPayload: S2C_DrawCard = { card };
        this.conn.sendTo(playerId, 'drawCard', drawPayload);
      }
    }

    // Finish the round
    const { isLastRound } = this.lobby.finishRound(lobbyId);

    if (isLastRound) {
      // Short delay then end game
      setTimeout(() => this.endGame(lobbyId), 500);
    }
  }

  private endGame(lobbyId: string): void {
    const finalScores = this.lobby.getFinalScores(lobbyId);
    const payload: S2C_GameEnded = { finalScores };
    this.conn.broadcastToLobby(lobbyId, 'gameEnded', payload);
  }

  private checkAutoAdvance(lobbyId: string): void {
    const gs = this.lobby.getLobby(lobbyId);
    if (!gs || !gs.currentRound) return;

    const connectedPlayers = [...gs.players.values()].filter(p => p.connected);
    const allSelected = connectedPlayers.every(p => p.selectedCardId !== null);

    if (allSelected && connectedPlayers.length > 0) {
      gs.currentRound.phase = 'revealing' as any;
      this.revealCards(lobbyId);
    }
  }
}
