import { useState } from 'react';

interface MemeCardProps {
  imageIndex: number;
  selected?: boolean;
  disabled?: boolean;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

/**
 * Meme card component.
 * Images are loaded from /memes/{imageIndex}.jpg
 * Falls back to a colored placeholder if the image doesn't exist.
 */
export default function MemeCard({ imageIndex, selected, disabled, faceDown, size = 'md', onClick }: MemeCardProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: 'w-32 h-20',
    md: 'w-48 h-32',
    lg: 'w-64 h-44',
  };

  // Generate a consistent color from the imageIndex
  const hue = (imageIndex * 137) % 360;

  if (faceDown) {
    return (
      <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-indigo-800 to-purple-900 border-2 border-indigo-600 flex items-center justify-center shadow-lg`}>
        <span className="text-3xl opacity-50">🃏</span>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl overflow-hidden border-2 transition-all duration-200 flex-shrink-0
        ${selected ? 'border-indigo-500 ring-2 ring-indigo-500 scale-105 shadow-lg shadow-indigo-500/30' : 'border-gray-700'}
        ${disabled ? 'opacity-60 cursor-default' : 'cursor-pointer hover:border-indigo-400 hover:scale-105 hover:shadow-lg'}
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
          style={{ backgroundColor: `hsl(${hue}, 60%, 25%)` }}
        >
          <span className="text-3xl">😂</span>
          <span className="text-xs font-mono text-white/60">#{imageIndex}</span>
        </div>
      )}
    </div>
  );
}
