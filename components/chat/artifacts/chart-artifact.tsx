'use client';

import dynamic from 'next/dynamic';

import { EmptyData } from '@/components/chat/artifacts/empty-data';

import type { ChatArtifact } from '@/lib/chat/types';

// Recharts is heavy and only needed when a chart artifact actually renders, so
// load it on demand (client-only) instead of in the main chat bundle.
const ChartArtifactImpl = dynamic(
  () => import('@/components/chat/artifacts/chart-artifact-impl').then((m) => m.ChartArtifactImpl),
  {
    ssr: false,
    loading: () => <div className="aspect-video w-full animate-pulse rounded-md bg-muted" />,
  }
);

export function ChartArtifact({ artifact }: { artifact: ChatArtifact }) {
  if (!artifact.chartSpec) {
    return <EmptyData />;
  }
  return <ChartArtifactImpl artifact={artifact} />;
}
