import { Telescope } from 'lucide-react';

import { cn } from '@/lib/utils';

/* eslint-disable react-doctor/only-export-components -- subcomponents exposed via Brand compound */

/**
 * Mirador brand mark: a telescope (a "mirador" is a lookout / panoramic view)
 * plus the wordmark. Compose which pieces you need:
 *
 * ```tsx
 * <Brand.Root>
 *   <Brand.Icon />
 *   <Brand.Wordmark />
 * </Brand.Root>
 * ```
 */

function BrandRoot({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span className={cn('inline-flex items-center justify-center gap-2', className)} {...props} />
  );
}

function BrandIcon({ className, ...props }: React.ComponentProps<typeof Telescope>) {
  return <Telescope className={cn('size-5 text-primary', className)} aria-hidden {...props} />;
}

function BrandWordmark({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn('font-heading text-base font-semibold tracking-tight', className)}
      {...props}
    >
      Mirador
    </span>
  );
}

export const Brand = {
  Root: BrandRoot,
  Icon: BrandIcon,
  Wordmark: BrandWordmark,
};
