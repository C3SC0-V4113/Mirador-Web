'use client';

import { ArrowUp } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { editDynamicChartVisualization } from '@/lib/chat/chat-client';
import { useDynamicChartsPreference } from '@/lib/chat/dynamic-charts-preference';
import { useChatStore } from '@/lib/chat/store';

import type { ChatArtifact } from '@/lib/chat/types';

export function DynamicChartControls({ artifact }: { artifact: ChatArtifact }) {
  const enabled = useDynamicChartsPreference((state) => state.enabled);
  const updateArtifactDynamicChartSpec = useChatStore(
    (state) => state.updateArtifactDynamicChartSpec
  );
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
      const result = await editDynamicChartVisualization(artifact.artifactId, message);
      if (result.requiresMainChat) {
        setNote(result.reason);
      } else {
        updateArtifactDynamicChartSpec({
          artifactId: artifact.artifactId,
          chartSpec: result.chartSpec,
        });
        setInstruction('');
      }
    } catch {
      setNote('No se pudo regenerar la gráfica; se conservó la versión anterior.');
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
          aria-label="Pedir un cambio a la gráfica dinámica"
          placeholder={
            enabled
              ? 'Pedí un cambio visual…'
              : 'Activa gráficas dinámicas para editar esta visualización'
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
          aria-label="Aplicar cambio a la gráfica dinámica"
          disabled={!enabled || isBusy}
        >
          <ArrowUp />
        </Button>
      </div>
      {!enabled ? (
        <p className="text-xs text-muted-foreground">
          La gráfica histórica sigue visible; activa la preferencia para editarla.
        </p>
      ) : null}
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </form>
  );
}
