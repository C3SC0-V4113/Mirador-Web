import { ActionPlanArtifact } from '@/components/chat/artifacts/action-plan-artifact';
import { ChartArtifact } from '@/components/chat/artifacts/chart-artifact';
import { DynamicChartArtifact } from '@/components/chat/artifacts/dynamic-chart-artifact';
import { FallbackArtifact } from '@/components/chat/artifacts/fallback-artifact';
import { KnowledgeArtifact } from '@/components/chat/artifacts/knowledge-artifact';
import { KpiArtifact } from '@/components/chat/artifacts/kpi-artifact';
import { ReportArtifact } from '@/components/chat/artifacts/report-artifact';
import { SandboxDashboardArtifact } from '@/components/chat/artifacts/sandbox-dashboard-artifact';
import { TableArtifact } from '@/components/chat/artifacts/table-artifact';
import { TextArtifact } from '@/components/chat/artifacts/text-artifact';

import type { ChatArtifact } from '@/lib/chat/types';

/** Picks the typed renderer for an artifact (dispatch on `artifact_type`). */
export function ArtifactBody({ artifact }: { artifact: ChatArtifact }) {
  switch (artifact.artifactType) {
    case 'text':
      return <TextArtifact artifact={artifact} />;
    case 'kpi':
      return <KpiArtifact artifact={artifact} />;
    case 'table':
      return <TableArtifact artifact={artifact} />;
    case 'chart':
      return <ChartArtifact artifact={artifact} />;
    case 'dynamic_chart':
      return <DynamicChartArtifact artifact={artifact} />;
    case 'sandbox_dashboard':
      return <SandboxDashboardArtifact artifact={artifact} />;
    case 'report':
      return <ReportArtifact artifact={artifact} />;
    case 'action_plan':
      return <ActionPlanArtifact artifact={artifact} />;
    case 'knowledge':
      return <KnowledgeArtifact artifact={artifact} />;
    default:
      return <FallbackArtifact artifact={artifact} />;
  }
}
