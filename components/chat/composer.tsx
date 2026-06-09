import { Textarea } from '@/components/ui/textarea';

export function Composer() {
  return (
    <div className="shrink-0 border-t bg-background p-4">
      <div className="mx-auto w-full max-w-3xl">
        <Textarea
          aria-label="Escribe tu mensaje"
          placeholder="Pregúntale a Mirador sobre tu negocio…"
          className="max-h-40"
        />
      </div>
    </div>
  );
}
