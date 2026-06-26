'use client';

import dynamic from 'next/dynamic';

import { DynamicChartControls } from '@/components/chat/artifacts/dynamic-chart-controls';
import { EmptyData } from '@/components/chat/artifacts/empty-data';

import type { ChatArtifact } from '@/lib/chat/types';

const DynamicChartArtifactImpl = dynamic(
  () =>
    import('@/components/chat/artifacts/dynamic-chart-artifact-impl').then(
      (module) => module.DynamicChartArtifactImpl
    ),
  {
    ssr: false,
    loading: () => <div className="aspect-video w-full animate-pulse rounded-md bg-muted" />,
  }
);

export function DynamicChartArtifact({ artifact }: { artifact: ChatArtifact }) {
  if (!artifact.dynamicChartSpec) {
    return <EmptyData />;
  }

  return (
    <>
      <DynamicChartControls artifact={artifact} />
      <DynamicChartArtifactImpl artifact={artifact} />
    </>
  );
}
