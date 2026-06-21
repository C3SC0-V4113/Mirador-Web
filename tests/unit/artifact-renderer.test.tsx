import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ArtifactRenderer } from '@/components/chat/artifacts/artifact-renderer';
import { ChatRuntimeProvider } from '@/components/chat/chat-runtime-provider';
import { chatStrings } from '@/lib/chat/strings';

import type { ChatArtifact } from '@/lib/chat/types';

function base(overrides: Partial<ChatArtifact>): ChatArtifact {
  return { artifactId: 'a1', artifactType: 'text', ...overrides };
}

describe('ArtifactRenderer', () => {
  it('renders a table with headers and cell values', () => {
    render(
      <ArtifactRenderer
        artifact={base({
          artifactType: 'table',
          question: 'Detalle',
          data: [
            { mes: 'Ene', mrr: 1000 },
            { mes: 'Feb', mrr: 2000 },
          ],
        })}
      />
    );

    expect(screen.getByRole('columnheader', { name: 'mes' })).toBeDefined();
    expect(screen.getByRole('columnheader', { name: 'mrr' })).toBeDefined();
    expect(screen.getByRole('cell', { name: 'Ene' })).toBeDefined();
    // 2000 is rendered via toLocaleString.
    expect(screen.getByText((2000).toLocaleString())).toBeDefined();
  });

  it('renders a KPI value from the first numeric field', () => {
    render(<ArtifactRenderer artifact={base({ artifactType: 'kpi', data: [{ mrr: 58000 }] })} />);

    expect(screen.getByText((58000).toLocaleString())).toBeDefined();
  });

  it('routes unknown artifact types to the fallback', () => {
    render(<ArtifactRenderer artifact={base({ artifactType: 'mystery', summary: 'algo' })} />);

    expect(screen.getByText(chatStrings.artifacts.fallbackNotice)).toBeDefined();
  });

  it('surfaces the artifact question and freshness in the frame', () => {
    // Chart artifacts include interactive controls that read the chat runtime.
    render(
      <ChatRuntimeProvider>
        <ArtifactRenderer
          artifact={base({
            artifactType: 'chart',
            question: 'Evolución del MRR',
            freshness: { status: 'fresh' },
            chartSpec: { type: 'line', x: 'month', y: ['mrr'] },
            data: [{ month: 'Ene', mrr: 1 }],
          })}
        />
      </ChatRuntimeProvider>
    );

    expect(screen.getByText('Evolución del MRR')).toBeDefined();
    expect(screen.getByText(chatStrings.artifacts.freshness.fresh)).toBeDefined();
  });
});
