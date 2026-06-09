/**
 * Centralized Spanish UI strings for the chat surface.
 *
 * Hardcoded Spanish (the repo's current convention) but kept in one module so
 * the UI can be localized later without structural changes. No `next-intl` yet.
 */
import type { ChatIntentMode } from '@/lib/chat/types';

export const chatStrings = {
  composer: {
    placeholder: 'Pregúntale a Mirador sobre tu negocio…',
    ariaLabel: 'Escribe tu mensaje',
    send: 'Enviar',
    stop: 'Detener',
    intentLabel: 'Modo de respuesta',
  },
  intentModes: {
    responder: {
      label: 'Responder',
      description: 'Respuesta directa en lenguaje natural.',
    },
    analizar: {
      label: 'Analizar',
      description: 'Prioriza el análisis de métricas.',
    },
    plan: {
      label: 'Plan',
      description: 'Prioriza un plan de acción estructurado.',
    },
  } satisfies Record<ChatIntentMode, { label: string; description: string }>,
  message: {
    thinking: 'Mirador está pensando…',
    copy: 'Copiar',
    copied: 'Copiado',
    retry: 'Reintentar',
    interrupted: 'Respuesta interrumpida.',
    citationsTitle: 'Fuentes',
    suggestedTitle: 'Preguntas sugeridas',
    warningsTitle: 'Advertencias sobre la calidad de los datos',
    traceLabel: 'ID de seguimiento',
    copyTrace: 'Copiar ID de seguimiento',
    traceCopied: 'ID de seguimiento copiado',
    you: 'Tú',
    assistant: 'Mirador',
  },
  errors: {
    requestFailed: 'No se pudo completar la solicitud. Inténtalo de nuevo.',
    noResponse: 'El servidor no devolvió una respuesta.',
    copyFailed: 'No se pudo copiar el mensaje.',
  },
} as const;
