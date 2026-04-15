import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import { LobbyManager } from './models/LobbyManager';
import { ConnectionHandler } from './handlers/connectionHandler';
import { GameHandler } from './handlers/gameHandler';

// --- Config ---
const PORT = parseInt(process.env.PORT || '8080', 10);
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(s => s.trim());
const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL || '30000', 10);

// --- Express setup (health check + CORS) ---
const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'meme-card-game-server' });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    connections: connectionHandler.getConnectionCount(),
    lobbies: lobbyManager.getLobbyCount(),
    uptime: process.uptime(),
  });
});

// --- HTTP + WebSocket server ---
const server = http.createServer(app);

const wss = new WebSocket.Server({
  server,
  path: '/ws',
  verifyClient: (info, cb) => {
    const origin = info.origin || info.req.headers.origin || '';
    // Allow all origins in development, check in production
    if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin) || !origin) {
      cb(true);
    } else {
      console.log(`Rejected connection from origin: ${origin}`);
      cb(false, 403, 'Origin not allowed');
    }
  },
});

// --- Core instances ---
const lobbyManager = new LobbyManager();
const connectionHandler = new ConnectionHandler();
const gameHandler = new GameHandler(lobbyManager, connectionHandler);

// --- Event routing ---
type EventName =
  | 'createLobby'
  | 'joinLobby'
  | 'leaveLobby'
  | 'hostSettings'
  | 'startGame'
  | 'submitSentences'
  | 'selectCard'
  | 'useJoker'
  | 'vote'
  | 'nextRound'
  | 'sendChatMessage'
  | 'ping';

function routeEvent(ws: WebSocket, eventName: EventName, data: any): void {
  switch (eventName) {
    case 'createLobby':
      gameHandler.handleCreateLobby(ws, data);
      break;
    case 'joinLobby':
      gameHandler.handleJoinLobby(ws, data);
      break;
    case 'leaveLobby':
      gameHandler.handleLeaveLobby(ws, data);
      break;
    case 'hostSettings':
      gameHandler.handleHostSettings(ws, data);
      break;
    case 'startGame':
      gameHandler.handleStartGame(ws, data);
      break;
    case 'submitSentences':
      gameHandler.handleSubmitSentences(ws, data);
      break;
    case 'selectCard':
      gameHandler.handleSelectCard(ws, data);
      break;
    case 'useJoker':
      gameHandler.handleUseJoker(ws, data);
      break;
    case 'vote':
      gameHandler.handleVote(ws, data);
      break;
    case 'nextRound':
      gameHandler.handleNextRound(ws, data);
      break;
    case 'sendChatMessage':
      gameHandler.handleSendChatMessage(ws, data);
      break;
    case 'ping':
      // Respond to client heartbeat
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ event: 'pong', data: {} }));
      }
      break;
    default:
      connectionHandler.sendError(ws, `Unbekanntes Event: ${eventName}`);
  }
}

// --- Heartbeat ---
interface ExtWebSocket extends WebSocket {
  isAlive?: boolean;
}

const heartbeatInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    const extWs = ws as ExtWebSocket;
    if (extWs.isAlive === false) {
      console.log('Terminating unresponsive client');
      gameHandler.handleDisconnect(ws);
      return ws.terminate();
    }
    extWs.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// --- Connection handling ---
wss.on('connection', (ws: WebSocket) => {
  const extWs = ws as ExtWebSocket;
  extWs.isAlive = true;

  ws.on('pong', () => {
    extWs.isAlive = true;
  });

  ws.on('message', (raw: WebSocket.RawData) => {
    extWs.isAlive = true;

    try {
      const message = JSON.parse(raw.toString());
      const { event, data } = message;

      if (!event || typeof event !== 'string') {
        connectionHandler.sendError(ws, 'Ungültiges Nachrichtenformat: "event" fehlt');
        return;
      }

      routeEvent(ws, event as EventName, data || {});
    } catch (err) {
      connectionHandler.sendError(ws, 'Ungültiges JSON-Format');
    }
  });

  ws.on('close', () => {
    gameHandler.handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    gameHandler.handleDisconnect(ws);
  });

  // Send welcome
  ws.send(JSON.stringify({
    event: 'welcome',
    data: { message: 'Verbunden mit Meme Card Game Server' },
  }));
});

// --- Start ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Meme Card Game Server running on port ${PORT}`);
  console.log(`   WebSocket endpoint: ws://localhost:${PORT}/ws`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  wss.clients.forEach(ws => ws.close());
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  wss.clients.forEach(ws => ws.close());
  server.close(() => process.exit(0));
});
