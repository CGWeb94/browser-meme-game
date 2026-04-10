import { useState } from 'react';
import type { PlayerInfo } from '../types';

interface PlayerSeatsProps {
  players: PlayerInfo[];
  currentPlayerId: string | null;
  playersReady: number;
  totalPlayers: number;
  selectedCardId: string | null;
}

function PlayerSeat({ player }: { player: PlayerInfo }) {
  const initials = player.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const statusText = !player.connected ? 'Getrennt' : 'Wählt Karte...';

  return (
    <div className="flex flex-col items-center gap-1.5 w-20">
      {/* Avatar */}
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold
          ${!player.connected ? 'bg-gray-700 text-gray-500' : 'bg-green-800 text-green-100'}
          border-2 ${!player.connected ? 'border-gray-600' : 'border-green-600'}
          shadow-lg`}
      >
        {initials}
      </div>
      {/* Name */}
      <span className="text-xs text-white font-medium truncate w-full text-center">
        {player.name}
      </span>
      {/* Status */}
      <span
        className={`text-xs truncate w-full text-center
          ${!player.connected ? 'text-red-400' : 'text-gray-400'}`}
      >
        {statusText}
      </span>
      {/* Score */}
      {player.score > 0 && (
        <span className="text-xs text-green-400 font-mono">{player.score} Pkt</span>
      )}
    </div>
  );
}

export default function PlayerSeats({
  players,
  currentPlayerId,
  playersReady,
  totalPlayers,
  selectedCardId,
}: PlayerSeatsProps) {
  const [overflowOpen, setOverflowOpen] = useState(false);

  const otherPlayers = players.filter(p => p.id !== currentPlayerId);
  const leftPlayers = otherPlayers.slice(0, 2);
  const rightPlayers = otherPlayers.slice(2, 4);
  const overflowPlayers = otherPlayers.slice(4);

  return (
    <>
      {/* Left seats */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-10">
        {leftPlayers.map(p => (
          <PlayerSeat key={p.id} player={p} />
        ))}
      </div>

      {/* Right seats */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-10 max-h-[60vh] overflow-y-auto">
        {rightPlayers.map(p => (
          <PlayerSeat key={p.id} player={p} />
        ))}
      </div>

      {/* Overflow badge + dropdown */}
      {overflowPlayers.length > 0 && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-20 z-20 hidden lg:block">
          <div className="relative">
            <button
              onClick={() => setOverflowOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/90 border border-gray-600
                       rounded-full text-sm text-white hover:bg-gray-700 transition-colors shadow-lg"
            >
              <span>👥</span>
              <span>+{overflowPlayers.length}</span>
            </button>
            {overflowOpen && (
              <div
                className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                          bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-3
                          min-w-[160px] space-y-2"
              >
                {overflowPlayers.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.connected ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.score > 0 && (
                      <span className="text-xs text-green-400 font-mono">{p.score} Pkt</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
