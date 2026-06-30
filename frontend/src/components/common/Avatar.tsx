'use client';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const sizeStyles = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`${sizeStyles[size]} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeStyles[size]} rounded-full bg-primary-100 text-primary-700 font-medium flex items-center justify-center`}
    >
      {name ? getInitials(name) : '?'}
    </div>
  );
}
