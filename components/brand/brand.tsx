import { Telescope } from 'lucide-react';

import { cn } from '@/lib/utils';

interface BrandProps {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
}

/**
 * Mirador brand mark: a telescope (a "mirador" is a lookout / panoramic view)
 * plus the wordmark. Pass `wordmarkClassName="hidden sm:inline"` to show the
 * icon only on small screens.
 */
export function Brand({ className, iconClassName, wordmarkClassName }: BrandProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Telescope className={cn('size-5 text-primary', iconClassName)} aria-hidden />
      <span
        className={cn('font-heading text-base font-semibold tracking-tight', wordmarkClassName)}
      >
        Mirador
      </span>
    </span>
  );
}
