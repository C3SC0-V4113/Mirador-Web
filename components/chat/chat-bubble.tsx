import { cva } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ChatBubbleAuthor = 'assistant' | 'system' | 'user';
type ChatBubbleState = 'complete' | 'error' | 'interrupted' | 'pending';

const chatBubbleRootVariants = cva(
  'max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed',
  {
    variants: {
      author: {
        user: 'ml-auto border-transparent bg-primary text-primary-foreground whitespace-pre-wrap',
        assistant: 'mr-auto border-border bg-card text-card-foreground',
        system: 'mr-auto border-border bg-muted/30 text-foreground',
      },
      state: {
        complete: '',
        pending: '',
        interrupted: '',
        error: 'border-destructive/40 bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      author: 'assistant',
      state: 'complete',
    },
  }
);

export function Root({
  className,
  author = 'assistant',
  state = 'complete',
  ...props
}: ComponentProps<'article'> & {
  author?: ChatBubbleAuthor;
  state?: ChatBubbleState;
}) {
  return (
    <article
      data-slot="chat-bubble-root"
      data-author={author}
      data-state={state}
      className={cn(chatBubbleRootVariants({ author, state }), className)}
      {...props}
    />
  );
}

export function Header({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="chat-bubble-header"
      className={cn('mb-1 text-xs font-medium tracking-wide opacity-80', className)}
      {...props}
    />
  );
}

export function Body({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="chat-bubble-body" className={className} {...props} />;
}

export function Footer({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="chat-bubble-footer"
      className={cn('mt-2 flex items-center justify-between gap-2 text-xs opacity-90', className)}
      {...props}
    />
  );
}

export function Actions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="chat-bubble-actions"
      className={cn('ml-auto flex items-center gap-1', className)}
      {...props}
    />
  );
}

export function Action({
  className,
  variant = 'ghost',
  size = 'xs',
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="chat-bubble-action"
      variant={variant}
      size={size}
      className={className}
      {...props}
    />
  );
}
