'use client';

// eslint-disable-next-line react-doctor/prefer-dynamic-import -- this module is itself loaded on demand via next/dynamic from chart-artifact.tsx
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from 'recharts';

import { EmptyData } from '@/components/chat/artifacts/empty-data';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { chatStrings } from '@/lib/chat/strings';

import type { ChartConfig } from '@/components/ui/chart';
import type { ArtifactRow, ChartSeries, ChartSpec, ChatArtifact } from '@/lib/chat/types';

type ChartRow = Record<string, string | number>;

function resolveSeries(spec: ChartSpec): ChartSeries[] {
  if (spec.series && spec.series.length > 0) {
    return spec.series;
  }
  return spec.y.map((key) => ({ key, label: spec.labels?.[key] ?? key }));
}

/**
 * A chart is only renderable if its x-axis and at least one y-series exist as
 * columns in the data. Otherwise we'd plot `undefined` (empty chart + duplicate
 * keys). Defensive net for any chart_spec that doesn't match its rows.
 */
function hasRenderableColumns(spec: ChartSpec, rows: ArtifactRow[]): boolean {
  const columns = new Set(Object.keys(rows[0] ?? {}));
  return columns.has(spec.x) && spec.y.some((key) => columns.has(key));
}

function coerceData(rows: ArtifactRow[], spec: ChartSpec, series: ChartSeries[]): ChartRow[] {
  return rows.map((row) => {
    const xValue = row[spec.x];
    const next: ChartRow = { [spec.x]: xValue === null ? '' : xValue };
    for (const item of series) {
      const value = row[item.key];
      next[item.key] = typeof value === 'number' ? value : Number(value);
    }
    return next;
  });
}

function buildConfig(series: ChartSeries[]): ChartConfig {
  return Object.fromEntries(
    series.map((item, index) => [
      item.key,
      { label: item.label ?? item.key, color: item.color ?? `var(--chart-${(index % 5) + 1})` },
    ])
  );
}

/**
 * Builds the Recharts element for the spec. Kept as a plain element builder (not
 * a component) because `ChartContainer`/`ResponsiveContainer` clone their single
 * child to inject dimensions — a wrapper component would break measurement.
 */
function buildChartElement(spec: ChartSpec, data: ChartRow[], series: ChartSeries[]) {
  const showLegend = series.length > 1;
  const axis = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey={spec.x}
        tickLine={false}
        axisLine={false}
        tickMargin={8}
        label={{
          value: spec.labels?.[spec.x] ?? spec.x,
          position: 'insideBottom',
          offset: -4,
        }}
      />
      <ChartTooltip content={<ChartTooltipContent />} />
      {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
    </>
  );

  if (spec.type === 'pie') {
    const valueKey = series[0]?.key ?? '';
    return (
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey={spec.x} />} />
        <Pie data={data} dataKey={valueKey} nameKey={spec.x}>
          {data.map((row, index) => (
            <Cell key={`cell-${String(index)}`} fill={`var(--chart-${(index % 5) + 1})`} />
          ))}
        </Pie>
      </PieChart>
    );
  }

  if (spec.type === 'line') {
    return (
      <LineChart accessibilityLayer data={data}>
        {axis}
        {series.map((item) => (
          <Line
            key={item.key}
            dataKey={item.key}
            type="monotone"
            stroke={`var(--color-${item.key})`}
            dot={false}
          />
        ))}
      </LineChart>
    );
  }

  if (spec.type === 'area') {
    return (
      <AreaChart accessibilityLayer data={data}>
        {axis}
        {series.map((item) => (
          <Area
            key={item.key}
            dataKey={item.key}
            type="monotone"
            stroke={`var(--color-${item.key})`}
            fill={`var(--color-${item.key})`}
            fillOpacity={0.2}
          />
        ))}
      </AreaChart>
    );
  }

  return (
    <BarChart accessibilityLayer data={data}>
      {axis}
      {series.map((item) => (
        <Bar
          key={item.key}
          dataKey={item.key}
          fill={`var(--color-${item.key})`}
          radius={4}
          stackId={spec.type === 'stacked_bar' ? 'stack' : undefined}
        />
      ))}
    </BarChart>
  );
}

export function ChartArtifactImpl({ artifact }: { artifact: ChatArtifact }) {
  const spec = artifact.chartSpec;
  const rows = artifact.data ?? [];

  if (!spec || spec.y.length === 0 || rows.length === 0 || !hasRenderableColumns(spec, rows)) {
    return <EmptyData />;
  }

  const series = resolveSeries(spec);
  const chartElement = buildChartElement(spec, coerceData(rows, spec, series), series);
  const config = buildConfig(series);
  const ariaLabel = `${chatStrings.artifacts.chartAltPrefix}: ${artifact.question ?? artifact.summary ?? spec.type}`;

  return (
    <ChartContainer
      config={config}
      className="aspect-video w-full"
      role="img"
      aria-label={ariaLabel}
    >
      {chartElement}
    </ChartContainer>
  );
}
