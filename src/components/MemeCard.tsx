import { useState } from 'react';

interface MemeCardProps {
  imageIndex: number;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Meme card component — landscape (16:9-ish) format.
 * Images are loaded from /memes/{imageIndex}.jpg
 * Falls back to a colored placeholder if the image doesn't exist.
 */
export default function MemeCard({
  imageIndex,
  selected,
  disabled,
  faceDown,
  size = 'md',
  onClick,
  style,
}: MemeCardProps) {
  const [imgError, setImgError] = useState(false);

  // All sizes are landscape (wider than tall)
  const sizeClasses: Record<string, string> = {
    sm: 'w-32 h-20',   // 128x80
    md: 'w-48 h-32',   // 192x128
    lg: 'w-96 h-64',   // 384x256
  };

  const hue = (imageIndex * 137) % 360;

  if (faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
        style={{
          ...style,
          background: 'linear-gradient(135deg, #1e4d30 0%, #0f2d1a 100%)',
          border: '2px solid rgba(212, 160, 32, 0.35)',
        }}
      >
        <span className="text-3xl opacity-40">🃏</span>
      </div>
    );
  }

  const selectedStyle: React.CSSProperties = selected
    ? {
        borderColor: '#d4a020',
        boxShadow: '0 0 0 2px #d4a020, 0 0 20px rgba(212, 160, 32, 0.45)',
        transform: 'scale(1.04)',
      }
    : {};

  return (
    <div
      style={{ ...style, ...selectedStyle }}
      className={`${sizeClasses[size]} rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0
        ${selected ? 'border-amber-500' : 'border-gray-600'}
        ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:border-amber-400/50 hover:scale-105 hover:shadow-lg'}
      `}
      onClick={disabled ? undefined : onClick}
    >
      {!imgError ? (
        <img
          src={`/memes/${imageIndex}.jpg`}
          alt={`Meme #${imageIndex}`}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{ backgroundColor: `hsl(${hue}, 55%, 22%)` }}
        >
          <span className="text-3xl">😂</span>
          <span className="text-xs font-mono text-white/50">#{imageIndex}</span>
        </div>
      )}
    </div>
  );
}
