'use client';

import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'idle' | 'busy' | 'active' | 'inactive';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const statusStyles = {
  online: {
    dot: 'bg-emerald-500',
    label: 'text-emerald-600',
    animated: 'animate-pulse',
  },
  offline: {
    dot: 'bg-gray-400',
    label: 'text-gray-600',
    animated: '',
  },
  idle: {
    dot: 'bg-amber-500',
    label: 'text-amber-600',
    animated: 'animate-pulse',
  },
  busy: {
    dot: 'bg-red-500',
    label: 'text-red-600',
    animated: 'animate-pulse',
  },
  active: {
    dot: 'bg-blue-500',
    label: 'text-blue-600',
    animated: 'animate-pulse',
  },
  inactive: {
    dot: 'bg-gray-400',
    label: 'text-gray-600',
    animated: '',
  },
};

const sizes = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export function StatusIndicator({
  status,
  label,
  size = 'md',
  animated = true,
}: StatusIndicatorProps) {
  const style = statusStyles[status];
  const sizeClass = sizes[size];
  const animationClass = animated ? style.animated : '';

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        'rounded-full',
        sizeClass,
        style.dot,
        animationClass
      )} />
      {label && (
        <span className={cn('text-xs font-medium', style.label)}>
          {label}
        </span>
      )}
    </div>
  );
}

