# Meme Card Game — Projektübersicht

## Was ist das?

Ein Multiplayer-Meme-Kartenspiel als Browseranwendung. Spieler treten Lobbys bei, jede Runde gibt es einen Satz/eine Situation, und jeder Spieler legt verdeckt eine Bildkarte (Meme). Karten werden aufgedeckt, bewertet, und am Ende gewinnt der Spieler mit den meisten Punkten.

## Architektur

```
Frontend (Vercel)  ◄──── WebSocket ────►  Backend (Railway)
     │                                        │
     └─ Bilder/Memes                          └─ Spiellogik, Lobby, Deck
        lokal im Client                           serverseitig
```

- **Frontend**: Wird auf Vercel gehostet. Stellt Meme-Bilder bereit und rendert das UI.
- **Backend**: Node.js/TypeScript WebSocket-Server auf Railway. Verwaltet Lobbys, Kartendecks, Runden, Punkte.

## Projektstruktur

```
browser-meme-game/
├── CLAUDE.md                    # Diese Datei
├── DEPLOYMENT.md                # Deployment-Anleitung
└── server/                      # Backend
    ├── package.json
    ├── tsconfig.json
    ├── Dockerfile               # Für Container-Deployments
    ├── railway.json              # Railway-Konfiguration
    ├── .env.example
    └── src/
        ├── index.ts              # Server-Einstiegspunkt (Express + WS)
        ├── types.ts              # Alle TypeScript-Typen, Events, Konstanten
        ├── models/
        │   └── LobbyManager.ts   # Spiellogik: Lobbys, Runden, Karten, Joker
        ├── handlers/
        │   ├── connectionHandler.ts  # WS-Verbindungen, send/broadcast
        │   └── gameHandler.ts        # Event-Routing → Spiellogik
        └── utils/
            ├── idGenerator.ts    # Lobby-Codes, Player/Card-IDs
            ├── deck.ts           # Deck erstellen, mischen, ziehen
            └── defaultSentences.ts # Standard-Rundentexte (deutsch)
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Sprache**: TypeScript (strict mode)
- **WebSocket**: `ws` Library
- **HTTP**: Express (Health-Check, CORS)
- **Hosting**: Railway (Free Tier, WebSocket-Support)
- **Frontend-Hosting**: Vercel

## Kernkonzepte

### Spielablauf
1. Host erstellt Lobby → bekommt 6-stelligen Code
2. Spieler treten bei (min. 3, max. 10)
3. Host wählt Einstellungen: Rundenzahl, Satzmodus, Kartensatzgröße
4. Spielstart → jeder bekommt 6 Karten
5. Optional: Spieler schreiben Sätze (bei "player_generated"-Modus)
6. Pro Runde: Satz wird gezeigt → Karte wählen → aufdecken → voten → Punkte
7. Nach jeder Runde: automatisch 1 Karte nachziehen
8. Am Ende: Endwertung mit Ranking

### Satzmodi
- **random**: Server wählt aus vorgefertigten deutschen Sätzen (`defaultSentences.ts`)
- **player_generated**: Vor Runde 1 schreibt jeder 1-2 Sätze, Server mischt sie

### Joker
- Max. 3 pro Spiel pro Spieler
- Tauscht eine Handkarte gegen eine zufällige vom Nachziehstapel

### Sicherheit
- Server kontrolliert allen Zufall (Deck, Mischen, Ziehen)
- Kartenbesitz wird serverseitig validiert
- Spieler können nicht für eigene Karten stimmen
- Joker-Limit wird serverseitig durchgesetzt

## WebSocket-Events

### Client → Server
| Event | Payload | Beschreibung |
|-------|---------|-------------|
| `createLobby` | `{ playerName }` | Lobby erstellen |
| `joinLobby` | `{ lobbyId, playerName }` | Lobby beitreten |
| `leaveLobby` | `{ lobbyId }` | Lobby verlassen |
| `hostSettings` | `{ lobbyId, settings }` | Einstellungen ändern |
| `startGame` | `{ lobbyId }` | Spiel starten |
| `submitSentences` | `{ lobbyId, sentences[] }` | Sätze einreichen |
| `selectCard` | `{ lobbyId, cardId }` | Karte wählen |
| `useJoker` | `{ lobbyId, cardId }` | Joker einsetzen |
| `vote` | `{ lobbyId, cardId }` | Für Karte stimmen |
| `nextRound` | `{ lobbyId }` | Nächste Runde (Host) |
| `ping` | `{}` | Heartbeat |

### Server → Client
| Event | Beschreibung |
|-------|-------------|
| `welcome` | Verbindung bestätigt |
| `lobbyCreated` | Lobby erstellt, ID + Player-ID |
| `lobbyJoined` | Lobby-State nach Beitritt |
| `playerJoined` | Neuer Spieler (Broadcast) |
| `playerLeft` | Spieler verlassen |
| `hostChanged` | Neuer Host |
| `settingsChanged` | Settings-Update |
| `gameStarted` | Spiel beginnt, Hand-Karten |
| `requestSentences` | Aufforderung: Sätze schreiben |
| `sentencesCollected` | Fortschritt der Satzsammlung |
| `roundText` | Rundentext + Rundennummer |
| `cardSelected` | Kartenauswahl-Fortschritt |
| `revealCards` | Aufgedeckte Karten (anonym) |
| `voteReceived` | Abstimmungsfortschritt |
| `roundResults` | Rundenergebnis + Punkte |
| `drawCard` | Nachgezogene Karte (privat) |
| `jokerUsed` | Joker-Ergebnis (privat) |
| `gameEnded` | Endwertung |
| `playerDisconnected` | Spieler getrennt |
| `playerReconnected` | Spieler wieder da |
| `error` | Fehlermeldung |
| `pong` | Heartbeat-Antwort |

## Befehle

```bash
cd server
npm install          # Abhängigkeiten installieren
npm run dev          # Entwicklungsserver (hot-reload)
npm run build        # TypeScript kompilieren
npm start            # Produktionsserver starten
```

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|-------------|
| `PORT` | `8080` | Server-Port (Railway setzt automatisch) |
| `ALLOWED_ORIGINS` | `localhost:3000,5173` | CORS-Origins (kommasepariert) |
| `HEARTBEAT_INTERVAL` | `30000` | WebSocket Ping-Intervall in ms |

## Spielablauf-Diagramm

```
WAITING ──[startGame]──► COLLECTING_SENTENCES ──[alle Sätze da]──► PLAYING
   │                           (nur bei player_generated)              │
   │                                                                   │
   └──[startGame + random mode]──────────────────────────────────► PLAYING
                                                                       │
                                                               ┌──────┘
                                                               ▼
                                                    ┌─── RUNDE ────┐
                                                    │  roundText    │
                                                    │  selectCard   │
                                                    │  revealCards  │
                                                    │  vote         │
                                                    │  roundResults │
                                                    │  drawCard     │
                                                    └──────┬───────┘
                                                           │
                                              ┌────────────┴────────────┐
                                              ▼                         ▼
                                        nextRound                  FINISHED
                                       (zurück ↑)               (gameEnded)
```
