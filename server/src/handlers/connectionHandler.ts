import WebSocket from 'ws';

/**
 * Manages WebSocket connections, mapping player IDs to sockets and vice versa.
 */
export class ConnectionHandler {
  // playerId -> WebSocket
  private playerSockets: Map<string, WebSocket> = new Map();
  // WebSocket -> { playerId, lobbyId }
  private socketMeta: Map<WebSocket, { playerId: string; lobbyId: string }> = new Map();

  register(ws: WebSocket, playerId: string, lobbyId: string): void {
    this.playerSockets.set(playerId, ws);
    this.socketMeta.set(ws, { playerId, lobbyId });
  }

  unregister(ws: WebSocket): { playerId: string; lobbyId: string } | undefined {
    const meta = this.socketMeta.get(ws);
    if (meta) {
      this.playerSockets.delete(meta.playerId);
      this.socketMeta.delete(ws);
    }
    return meta;
  }

  getSocket(playerId: string): WebSocket | undefined {
    return this.playerSockets.get(playerId);
  }

  getMeta(ws: WebSocket): { playerId: string; lobbyId: string } | undefined {
    return this.socketMeta.get(ws);
  }

  isRegistered(ws: WebSocket): boolean {
    return this.socketMeta.has(ws);
  }

  /**
   * Send a JSON event to a specific player.
   */
  sendTo(playerId: string, event: string, data: unknown): void {
    const ws = this.playerSockets.get(playerId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data }));
    }
  }

  /**
   * Broadcast a JSON event to all players in a lobby.
   */
  broadcastToLobby(lobbyId: string, event: string, data: unknown, excludePlayerId?: string): void {
    for (const [ws, meta] of this.socketMeta.entries()) {
      if (meta.lobbyId === lobbyId && meta.playerId !== excludePlayerId) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event, data }));
        }
      }
    }
  }

  /**
   * Send an error message to a specific socket.
   */
  sendError(ws: WebSocket, message: string): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event: 'error', data: { message } }));
    }
  }

  getConnectionCount(): number {
    return this.socketMeta.size;
  }
}
