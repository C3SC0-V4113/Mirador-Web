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

function rowKey(row: ArtifactRow): string {
  return Object.values(row)
    .map((value) => String(value))
    .join('|');
}

/** Accessible data table from `data[]` rows (DESIGN.md: tables for records). */
export function TableArtifact({ artifact }: { artifact: ChatArtifact }) {
  const rows = artifact.data ?? [];

  if (rows.length === 0) {
    return <EmptyData />;
  }

  const columns = Object.keys(rows[0]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={rowKey(row)}>
            {columns.map((column) => (
              <TableCell key={column}>{formatCell(row[column])}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
