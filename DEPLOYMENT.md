# Deployment Guide — Meme Card Game

## Architektur

```
┌──────────────┐     WebSocket (wss://)     ┌──────────────────┐
│              │ ◄─────────────────────────► │                  │
│   Frontend   │                             │     Backend      │
│   (Vercel)   │                             │   (Railway.app)  │
│              │ ────── HTTP health ───────► │                  │
└──────────────┘                             └──────────────────┘
```

---

## Backend Deployment auf Railway

### Warum Railway?

- **Kostenlos**: 500 Stunden/Monat im Free Tier (reicht für ein Hobbyprojekt)
- **WebSocket-Support**: Nativ unterstützt, kein Timeout bei long-lived connections
- **Einfach**: Push-to-deploy via GitHub
- **Node.js-optimiert**: Erkennt `package.json` automatisch

### Schritte

1. **Erstelle ein Railway-Konto**: https://railway.app
2. **Neues Projekt → "Deploy from GitHub repo"**
3. **Root-Verzeichnis setzen**: `/server`
4. **Environment Variables setzen**:

   | Variable | Wert | Beschreibung |
   |----------|------|-------------|
   | `PORT` | (automatisch von Railway) | Nicht manuell setzen |
   | `ALLOWED_ORIGINS` | `https://dein-projekt.vercel.app` | Frontend-URL |
   | `HEARTBEAT_INTERVAL` | `30000` | Ping-Intervall in ms |
   | `MAX_PLAYERS_PER_LOBBY` | `10` | Max Spieler |

5. **Deploy**: Railway baut und startet automatisch
6. **Domain**: Railway vergibt eine URL wie `meme-game-server-production.up.railway.app`

### Alternativ: Render.com

Falls Railway nicht möglich:

1. Neuer "Web Service" auf https://render.com
2. Root Directory: `server`
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Environment: Node
6. **Wichtig**: Render hat ein Free-Tier Spin-down nach 15 Min Inaktivität

### Alternativ: Fly.io

1. `fly launch` im `/server` Verzeichnis
2. Nutzt den vorhandenen `Dockerfile`
3. `fly deploy`

---

## Frontend Deployment auf Vercel

### WebSocket-Verbindung im Frontend

```typescript
// Im Frontend-Code:
const WS_URL = process.env.NEXT_PUBLIC_WS_URL
  || 'wss://dein-railway-projekt.up.railway.app/ws';

const socket = new WebSocket(WS_URL);
```

### Vercel Environment Variable

Setze in den Vercel Project Settings:

| Variable | Wert |
|----------|------|
| `NEXT_PUBLIC_WS_URL` | `wss://dein-railway-url.up.railway.app/ws` |

### Vercel Deploy

1. Verbinde dein GitHub-Repo mit Vercel
2. Root Directory: `/` (oder wo das Frontend liegt)
3. Framework: Next.js / Vite / etc.
4. Environment Variable setzen (s.o.)
5. Deploy

---

## Lokale Entwicklung

```bash
# Backend starten
cd server
cp .env.example .env
npm install
npm run dev

# Server läuft auf http://localhost:8080
# WebSocket auf ws://localhost:8080/ws
```

---

## Health Check

```bash
curl http://localhost:8080/health
# → { "status": "ok", "connections": 0, "lobbies": 0, "uptime": 42.5 }
```

---

## WebSocket-URL Struktur

| Umgebung | URL |
|----------|-----|
| Lokal | `ws://localhost:8080/ws` |
| Railway | `wss://<project>.up.railway.app/ws` |
| Render | `wss://<project>.onrender.com/ws` |
| Fly.io | `wss://<project>.fly.dev/ws` |
