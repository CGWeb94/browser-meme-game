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
├── content/meta.txt             # Projekt-Metadaten (Domain, GitHub, Vercel)
├── package.json                 # Frontend (Vite + React + TS)
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── vercel.json                  # Vercel-Deployment-Config
├── index.html
├── public/
│   └── memes/                   # ← HIER BILDER ABLEGEN: 0.jpg, 1.jpg, 2.jpg, ...
├── src/                         # Frontend-Source
│   ├── main.tsx
│   ├── App.tsx                  # Screen-Router
│   ├── index.css                # Tailwind + Custom-Styles
│   ├── types.ts                 # Shared Types (Client-seitig)
│   ├── vite-env.d.ts
│   ├── hooks/
│   │   └── useWebSocket.ts      # WS-Verbindung, auto-reconnect, heartbeat
│   ├── context/
│   │   └── GameContext.tsx       # Zentraler Spielzustand (useReducer)
│   └── components/
│       ├── Landing.tsx           # Start: Lobby erstellen/beitreten
│       ├── Lobby.tsx             # Warteraum, Einstellungen
│       ├── SentenceCollection.tsx # Sätze schreiben (optional)
│       ├── GameRound.tsx         # Kartenauswahl + Joker
│       ├── CardReveal.tsx        # Aufdecken + Voting
│       ├── RoundResults.tsx      # Rundenergebnis
│       ├── FinalScores.tsx       # Endwertung
│       ├── MemeCard.tsx          # Karten-Komponente (Bild oder Platzhalter)
│       └── PlayerList.tsx        # Spielerliste
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

## Meme-Bilder

Bilder werden aus `public/memes/` geladen. Die `imageIndex`-Nummer vom Server mappt direkt auf den Dateinamen.
Wenn ein Bild fehlt, zeigt die MemeCard einen farbigen Platzhalter mit Emoji.

### Format & Ablage

| Feld | Details |
|------|---------|
| **Ordner** | `public/memes/` |
| **Dateinamen** | `0.jpg`, `1.jpg`, `2.jpg`, ... (nur Zahlen, keine Leerzeichen/Sonderzeichen) |
| **Format** | JPG bevorzugt (auch PNG möglich, Dateiendung anpassen) |
| **Größe** | Beliebig — `object-cover` passt die Bilder an den Kartenrahmen an |
| **Proportion** | Querformat empfohlen (z.B. 1920×1080, 1280×720) — passt perfekt zu den Kartenabmessungen |
| **Anzahl** | Sollte mindestens `cardSetSize` entsprechen (Standard: 120). Pro Lobby konfigurierbar. |

**Beispiel:** 
- 50 Meme-Bilder → `0.jpg` bis `49.jpg` in `public/memes/`
- In der Lobby: `cardSetSize = 50` setzen
- Pro Spiel werden 6 Karten × Anzahl Spieler benötigt

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js 18+ + TypeScript (strict mode)
- **WebSocket**: `ws` Library (Server), native `WebSocket` API (Client)
- **HTTP**: Express (Health-Check, CORS)
- **Frontend-Hosting**: Vercel → https://browser-meme-game.vercel.app
- **Backend-Hosting**: Railway (Free Tier, WebSocket-Support)
- **GitHub**: github.com/CGWeb94/browser-meme-game

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

### UI/UX — GameRound-Screen (Kartenauswahl)

**Poker-Tisch Aesthetic**
- Grüner "Filz"-Hintergrund mit radialer Vignette
- Karten fächerförmig angeordnet am unteren Bildrand (fan-out Layout)
- Karten heben sich beim Hovern ab und werden 1,25× vergrößert

**Kartenauswahl — Modal-Workflow**
1. Spieler klickt auf eine Karte → Großansicht-Modal öffnet sich
2. Modal zeigt die Karte in Originalgröße mit "Diese Karte spielen?" Bestätigung
3. Spieler klickt "Spielen" → Karte wird als gewählt registriert, Server wird benachrichtigt
4. Während andere Spieler noch wählen: Fortschrittsbalken zeigt, wie viele Spieler bereit sind

**Dealer-Animation**
- Beim Spielstart werden Karten eine nach der anderen vom unteren Rand "ausgeteilt" (150ms Verzögerung je Karte)
- Jede Karte fliegt von unten nach oben ins Fächerlayout
- Visuell: "Kartengeber teilt aus" wie am echten Pokertisch

**Joker-Button**
- Fester Button unten rechts: `🔄 Joker (X)` mit verbleibender Anzahl
- Disabled wenn: keine Joker mehr übrig ODER Spieler hat bereits eine Karte für diese Runde gewählt
- Klick → "Joker-Modus" aktiviert: Alle Karten erhalten gelbes Glow + ↔️ Icon
- Im Joker-Modus: Klick auf Karte → diese Karte wird mit einer zufälligen vom Nachziehstapel getauscht
- "Abbrechen"-Button neben Joker-Button zum Beenden des Joker-Modus

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
