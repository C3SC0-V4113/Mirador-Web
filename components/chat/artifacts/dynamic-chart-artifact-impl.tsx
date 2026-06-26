'use client';

import { useEffect, useRef, useState } from 'react';

import { EmptyData } from '@/components/chat/artifacts/empty-data';

import type { ChatArtifact } from '@/lib/chat/types';
import type { VisualizationSpec } from 'vega-embed';

export function DynamicChartArtifactImpl({ artifact }: { artifact: ChatArtifact }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failedSpec, setFailedSpec] = useState<ChatArtifact['dynamicChartSpec']>();
  const failed = failedSpec === artifact.dynamicChartSpec;

  useEffect(() => {
    const container = containerRef.current;
    const spec = artifact.dynamicChartSpec;

    if (!container || !spec) {
      return;
    }

    let disposed = false;
    let finalize: (() => void) | undefined;
    void import('vega-embed')
      .then(({ default: embed }) =>
        embed(container, spec as VisualizationSpec, {
          actions: false,
          renderer: 'svg',
        })
      )
      .then((result) => {
        if (disposed) {
          result.finalize();
          return;
        }
        finalize = () => result.finalize();
      })
      .catch(() => {
        if (!disposed) {
          setFailedSpec(spec);
        }
      });

    return () => {
      disposed = true;
      finalize?.();
      container.replaceChildren();
    };
  }, [artifact.dynamicChartSpec]);

  if (failed) {
    return <EmptyData />;
  }

  return (
    <figure
      aria-label={`Gráfico dinámico: ${artifact.question ?? artifact.summary ?? 'visualización'}`}
    >
      <div ref={containerRef} className="min-h-64 w-full overflow-x-auto" />
    </figure>
  );
}
