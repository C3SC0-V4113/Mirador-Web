import { EmptyData } from '@/components/chat/artifacts/empty-data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { ArtifactRow, ChatArtifact } from '@/lib/chat/types';

function formatCell(value: ArtifactRow[string]): string {
  if (value === null) {
    return '—';
  }
  return typeof value === 'number' ? value.toLocaleString() : value;
}

function rowKey(row: ArtifactRow, index: number): string {
  const valueKey = Object.values(row)
    .map((value) => String(value))
    .join('|');

  return `${valueKey}|${index}`;
}

/** Accessible data table from `data[]` rows (DESIGN.md: tables for records). */
export function TableArtifact({ artifact }: { artifact: ChatArtifact }) {
  const rows = artifact.data ?? [];

  if (rows.length === 0) {
    return <EmptyData />;
  }

  const columns = Object.keys(rows[0]);

  return (
    // Plain overflow div instead of the Base UI ScrollArea: its Viewport uses a
    // percentage height (`size-full`) that never resolves against a
    // max-height-only parent, so the content would not scroll internally. The
    // inner shadcn table-container's own overflow is neutralized so this
    // wrapper is the single scroll container and the sticky header tracks it.
    <div className="max-h-96 overflow-auto rounded-md [&_[data-slot=table-container]]:overflow-visible">
      <Table className="[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-card">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{artifact.labels?.[column] ?? column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={rowKey(row, index)}>
              {columns.map((column) => (
                <TableCell key={column}>{formatCell(row[column])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
