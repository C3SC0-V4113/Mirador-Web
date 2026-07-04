'use client';

import dynamic from 'next/dynamic';

import { EmptyData } from '@/components/chat/artifacts/empty-data';
import { SandboxDashboardControls } from '@/components/chat/artifacts/sandbox-dashboard-controls';

import type { ChatArtifact } from '@/lib/chat/types';

const SandboxDashboardArtifactImpl = dynamic(
  () =>
    import('@/components/chat/artifacts/sandbox-dashboard-artifact-impl').then(
      (module) => module.SandboxDashboardArtifactImpl
    ),
  {
    ssr: false,
    loading: () => <div className="h-[480px] w-full animate-pulse rounded-md bg-muted" />,
  }
);

export function SandboxDashboardArtifact({ artifact }: { artifact: ChatArtifact }) {
  if (!artifact.sandboxHtml) {
    return <EmptyData />;
  }

  return (
    <>
      <SandboxDashboardControls artifact={artifact} />
      <SandboxDashboardArtifactImpl artifact={artifact} />
    </>
  );
}
