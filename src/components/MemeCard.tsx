import { useState } from 'react';

interface MemeCardProps {
  imageIndex: number;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Meme card — always landscape, real-card look (white border, rounded corners).
 * Images loaded from /memes/{imageIndex}.jpg
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

  const sizeClasses: Record<string, string> = {
    sm:  'w-32 h-20',        // 128×80
    md:  'w-48 h-32',        // 192×128
    lg:  'w-96 h-64',        // 384×256
    xl:  'w-64 h-[170px]',   // 256×170 — CardReveal grid
  };

  const hue = (imageIndex * 137) % 360;

  if (faceDown) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-xl overflow-hidden shadow-lg flex-shrink-0`}
        style={{
          ...style,
          border: '8px solid #ffffff',
          borderRadius: '0.85rem',
        }}
      >
        <img
          src="/card-background.png"
          alt="Kartenrückseite"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        // Real playing card: white border, selected gets gold glow on top
        border: selected
          ? '8px solid #d4a020'
          : '8px solid #ffffff',
        borderRadius: '0.85rem',
        boxShadow: selected
          ? '0 0 0 2px #d4a020, 0 0 20px rgba(212,160,32,0.5), 0 4px 12px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.5)',
        transform: selected ? 'scale(1.03)' : undefined,
      }}
      className={`${sizeClasses[size]} overflow-hidden transition-all duration-200 flex-shrink-0
        ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:scale-105 hover:shadow-xl'}
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
