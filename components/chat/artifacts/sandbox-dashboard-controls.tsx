'use client';

import { ArrowUp } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { editSandboxDashboardVisualization } from '@/lib/chat/chat-client';
import { useSandboxDashboardsPreference } from '@/lib/chat/sandbox-dashboards-preference';
import { findUnsafeSandboxHtmlReason } from '@/lib/chat/sandbox-html-guard';
import { useChatStore } from '@/lib/chat/store';

import type { ChatArtifact } from '@/lib/chat/types';

export function SandboxDashboardControls({ artifact }: { artifact: ChatArtifact }) {
  const enabled = useSandboxDashboardsPreference((state) => state.enabled);
  const updateArtifactSandboxHtml = useChatStore((state) => state.updateArtifactSandboxHtml);
  const [instruction, setInstruction] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const message = instruction.trim();

    if (!enabled || !message || isBusy) {
      return;
    }

    setIsBusy(true);
    setNote(null);

    try {
      const result = await editSandboxDashboardVisualization(artifact.artifactId, message, enabled);
      if (result.requiresMainChat) {
        setNote(result.reason);
      } else if (findUnsafeSandboxHtmlReason(result.sandboxHtml) !== null) {
        // Never overwrite the store with html the renderer would refuse: the
        // previous panel stays visible and the user sees why nothing changed.
        setNote(
          'El panel regenerado no pasó la verificación de seguridad; se conservó la versión anterior.'
        );
      } else {
        updateArtifactSandboxHtml({
          artifactId: artifact.artifactId,
          sandboxHtml: result.sandboxHtml,
        });
        setInstruction('');
      }
    } catch (error) {
      const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
      setNote(`No se pudo regenerar el panel; se conservó la versión anterior.${detail}`);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form
      className="mb-2 flex flex-col gap-1.5"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <div className="flex items-center gap-1.5">
        <Input
          value={instruction}
          disabled={!enabled || isBusy}
          aria-label="Pedir un cambio al panel interactivo"
          placeholder={
            enabled
              ? 'Pedí un cambio…'
              : 'Activa paneles interactivos para editar esta visualización'
          }
          onChange={(event) => {
            setInstruction(event.target.value);
          }}
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="icon"
          variant="secondary"
          aria-label="Aplicar cambio al panel interactivo"
          disabled={!enabled || isBusy}
        >
          <ArrowUp />
        </Button>
      </div>
      {!enabled ? (
        <p className="text-xs text-muted-foreground">
          El panel histórico sigue visible; activa la preferencia para editarlo.
        </p>
      ) : null}
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </form>
  );
}
