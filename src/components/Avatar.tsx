import { useState } from 'react';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-7 h-7 text-[11px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();

  if (!src || failed) {
    return (
      <div
        aria-label={name}
        className={`${SIZE_CLASSES[size]} shrink-0 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold flex items-center justify-center select-none`}
      >
        {initials || 'AC'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${SIZE_CLASSES[size]} shrink-0 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900`}
    />
  );
}
