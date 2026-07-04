'use client';

import { Maximize2, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { findUnsafeSandboxHtmlReason } from '@/lib/chat/sandbox-html-guard';
import { chatStrings } from '@/lib/chat/strings';
import { cn } from '@/lib/utils';

import type { ChatArtifact } from '@/lib/chat/types';

const strings = chatStrings.artifacts.sandboxDashboard;

/*
  SECURITY INVARIANT: never add `allow-same-origin`, `allow-forms`,
  `allow-popups`, or `allow-downloads` to this sandbox attribute. The
  iframe's opaque origin (no `allow-same-origin`) is the isolation
  boundary that keeps AI-generated HTML from reading/writing this app's
  cookies, storage, or DOM. `allow-scripts` alone lets the dashboard's
  own inline script run against its own opaque document — that is the
  intended, contained capability. This component is the single place the
  sandbox attribute exists; both the inline view and the expanded Sheet
  view render through it.
*/
function SandboxFrame({
  html,
  title,
  className,
}: {
  html: string;
  title: string;
  className?: string;
}) {
  return (
    <iframe
      sandbox="allow-scripts"
      referrerPolicy="no-referrer"
      srcDoc={html}
      title={title}
      className={cn('w-full rounded-md border-0 bg-white', className)}
    />
  );
}

export function SandboxDashboardArtifactImpl({ artifact }: { artifact: ChatArtifact }) {
  const html = artifact.sandboxHtml ?? '';
  const unsafeReason = findUnsafeSandboxHtmlReason(html);

  if (unsafeReason !== null) {
    console.warn(
      `[sandbox-dashboard] artifact ${artifact.artifactId} failed the client-side tripwire (${unsafeReason}); refusing to render.`
    );

    return <p className="text-sm text-destructive">{strings.unsafeError}</p>;
  }

  const title = artifact.question ?? artifact.summary ?? strings.title;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-1.5">
        <section
          className="flex flex-1 items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-400"
          aria-label={strings.title}
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <p className="text-xs">{strings.warning}</p>
        </section>
        <Sheet>
          <SheetTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={strings.expandLabel}
              />
            }
          >
            <Maximize2 />
          </SheetTrigger>
          <SheetContent side="bottom" className="w-full max-w-none data-[side=bottom]:h-[92vh]">
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription className="sr-only">{strings.expandedDescription}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 px-4 pb-4">
              <SandboxFrame html={html} title={title} className="h-full" />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <SandboxFrame html={html} title={title} className="h-[480px]" />
    </div>
  );
}
