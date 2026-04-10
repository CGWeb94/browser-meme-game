import type { PlayerInfo } from '../types';

interface PlayerListProps {
  players: PlayerInfo[];
  hostId: string | null;
  currentPlayerId: string | null;
}

export default function PlayerList({ players, hostId, currentPlayerId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
        Spieler ({players.length})
      </h3>
      <ul className="space-y-1">
        {players.map(p => (
          <li
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm
              ${p.id === currentPlayerId ? 'bg-indigo-900/30 border border-indigo-800' : 'bg-gray-900/50'}
              ${!p.connected ? 'opacity-40' : ''}
            `}
          >
            <span className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-400' : 'bg-gray-600'}`} />
            <span className="flex-1 font-medium">{p.name}</span>
            {p.id === hostId && (
              <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-0.5 rounded-full">Host</span>
            )}
            {p.score > 0 && (
              <span className="text-xs text-indigo-400 font-mono">{p.score} Pkt</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
