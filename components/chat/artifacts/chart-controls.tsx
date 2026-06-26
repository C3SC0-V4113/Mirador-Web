'use client';

import { ArrowUp } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { useChatRuntime } from '@/components/chat/chat-runtime-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { editChartVisualization } from '@/lib/chat/chat-client';
import { useDynamicChartsPreference } from '@/lib/chat/dynamic-charts-preference';
import { useChatStore } from '@/lib/chat/store';
import { chatStrings } from '@/lib/chat/strings';
import { CHART_TYPES } from '@/lib/chat/types';

import type { ChartSpec, ChartType, ChatArtifact } from '@/lib/chat/types';

const strings = chatStrings.chartControls;

function asksForDynamicVisual(message: string) {
  return /heatmap|mapa de calor|scatter|dispersi[oó]n|histogram|histograma|distribution|distribuci[oó]n|facetas?|facets?|capas?|layers?|small multiples|composici[oó]n|composition|apilad[ao] normalizad[ao]|normalized stacking|din[aá]mic[ao]/iu.test(
    message
  );
}

/**
 * Mini-edit toolbar for a chart artifact: quick chart-type toggles (applied
 * optimistically + persisted via the structured endpoint) and a natural-language
 * box that may redirect to the main chat when the request needs new data.
 */
export function ChartControls({ artifact }: { artifact: ChatArtifact }) {
  const { sendPrompt } = useChatRuntime();
  const updateArtifactChartSpec = useChatStore((state) => state.updateArtifactChartSpec);
  const updateArtifactDynamicChartSpec = useChatStore(
    (state) => state.updateArtifactDynamicChartSpec
  );
  const dynamicChartsEnabled = useDynamicChartsPreference((state) => state.enabled);

  const [ask, setAsk] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const spec = artifact.chartSpec;

  if (!spec) {
    return null;
  }

  const currentType = spec.type;

  function applySpec(next: ChartSpec) {
    updateArtifactChartSpec({ artifactId: artifact.artifactId, chartSpec: next });
  }

  async function changeType(nextType: ChartType) {
    if (!spec || nextType === spec.type || isBusy) {
      return;
    }

    const previous = spec;
    const optimistic: ChartSpec = { ...spec, type: nextType };
    applySpec(optimistic);
    setNote(null);
    setIsBusy(true);

    try {
      const result = await editChartVisualization(
        artifact.artifactId,
        {
          chartSpec: { type: nextType, x: spec.x || null, y: spec.y[0] ?? '' },
        },
        dynamicChartsEnabled
      );
      if (!result.requiresMainChat) {
        if (result.chartSpec) {
          applySpec(result.chartSpec);
        }
        if (result.note) {
          setNote(result.note);
        }
      }
    } catch {
      applySpec(previous); // rollback
      setNote(strings.error);
    } finally {
      setIsBusy(false);
    }
  }

  async function submitAsk(event: FormEvent) {
    event.preventDefault();
    const message = ask.trim();

    if (!message || isBusy) {
      return;
    }

    setNote(null);

    if (!dynamicChartsEnabled && asksForDynamicVisual(message)) {
      setNote('Activá gráficas dinámicas para convertir esta visualización avanzada.');
      return;
    }

    setIsBusy(true);

    try {
      const result = await editChartVisualization(
        artifact.artifactId,
        { message },
        dynamicChartsEnabled
      );
      if (result.requiresMainChat) {
        setNote(strings.routedToMain);
        void sendPrompt(message);
      } else if (result.dynamicChartSpec) {
        updateArtifactDynamicChartSpec({
          artifactId: artifact.artifactId,
          chartSpec: result.dynamicChartSpec,
        });
      } else {
        if (result.chartSpec) {
          applySpec(result.chartSpec);
        }
        if (result.note) {
          setNote(result.note);
        }
      }
      setAsk('');
    } catch {
      setNote(strings.error);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mb-2 flex flex-col gap-2">
      <ToggleGroup
        value={[currentType]}
        onValueChange={(value: string[]) => {
          const next = value[0] as ChartType | undefined;
          if (next) {
            void changeType(next);
          }
        }}
        variant="outline"
        size="sm"
        aria-label={strings.label}
      >
        {CHART_TYPES.map((type) => (
          <ToggleGroupItem
            key={type}
            value={type}
            aria-label={strings.types[type]}
            disabled={isBusy}
          >
            {strings.types[type]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <form
        className="flex items-center gap-1.5"
        onSubmit={(event) => {
          void submitAsk(event);
        }}
      >
        <Input
          value={ask}
          disabled={isBusy}
          aria-label={strings.askLabel}
          placeholder={strings.askPlaceholder}
          onChange={(event) => {
            setAsk(event.target.value);
          }}
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="icon"
          variant="secondary"
          aria-label={strings.send}
          disabled={isBusy}
        >
          <ArrowUp />
        </Button>
      </form>

      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}
