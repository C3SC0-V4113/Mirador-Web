import { Telescope } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export function ChatEmptyState() {
  return (
    <Empty className="border-none">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Telescope />
        </EmptyMedia>
        <EmptyTitle>Empieza una conversación</EmptyTitle>
        <EmptyDescription>
          Inicia una sesión interactuando con el chat. Pregunta por tus métricas o por información
          de la empresa y Mirador te responderá aquí.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
