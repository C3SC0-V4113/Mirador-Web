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
    reporte_visual: {
      label: 'Reporte',
      description: 'Prioriza un reporte visual con gráfico y resumen.',
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
  emptyState: {
    title: 'Empieza una conversación',
    description:
      'Pregunta por tus métricas o por información de la empresa y Mirador te responderá aquí.',
    suggestionsTitle: 'Prueba con una de estas',
    suggestions: [
      '¿Cómo evolucionó el MRR en los últimos 6 meses?',
      '¿Cuáles son nuestros mayores riesgos operativos ahora?',
      'Resume el desempeño del último trimestre.',
      '¿Qué dice el manifiesto sobre nuestra misión?',
    ],
  },
  quickActions: {
    title: 'Acciones rápidas',
    actions: [
      {
        id: 'compare',
        label: 'Comparar',
        prompt: 'Compara estos resultados con el periodo anterior.',
      },
      {
        id: 'explain',
        label: 'Explicar',
        prompt: 'Explica las causas detrás de estos resultados.',
      },
      {
        id: 'forecast',
        label: 'Pronosticar',
        prompt: 'Proyecta la tendencia para los próximos 3 meses.',
      },
    ],
  },
  artifacts: {
    period: 'Periodo',
    sources: 'Fuentes',
    freshness: {
      fresh: 'Datos actuales',
      stale: 'Datos desactualizados',
      unknown: 'Frescura desconocida',
      generatedAt: 'Generado',
    },
    warningsTitle: 'Advertencias',
    traceLabel: 'ID de seguimiento',
    copyTrace: 'Copiar ID de seguimiento',
    traceCopied: 'ID de seguimiento copiado',
    fallbackNotice: 'Este tipo de artefacto aún no se puede mostrar.',
    chartAltPrefix: 'Gráfico',
    emptyData: 'Sin datos para mostrar.',
    kpiNoValue: '—',
    citationsTitle: 'Fuentes',
    actionKinds: {
      action: 'Acción',
      risk: 'Riesgo',
      next_step: 'Próximo paso',
    },
  },
  history: {
    open: 'Abrir conversaciones',
    title: 'Conversaciones',
    newConversation: 'Nueva conversación',
    empty: 'Todavía no tienes conversaciones.',
    loading: 'Cargando…',
    untitled: 'Conversación sin título',
    close: 'Cerrar',
    rename: 'Renombrar',
    renameLabel: 'Nuevo título de la conversación',
    save: 'Guardar',
    cancel: 'Cancelar',
  },
  chartControls: {
    label: 'Tipo de gráfico',
    types: {
      line: 'Línea',
      bar: 'Barras',
      area: 'Área',
      pie: 'Torta',
    },
    askLabel: 'Pedir un cambio al gráfico',
    askPlaceholder: 'Pedí un cambio… (ej. "mostralo por cliente")',
    send: 'Aplicar',
    routedToMain: 'Ese cambio necesita nuevos datos; lo envié al chat.',
    error: 'No se pudo actualizar el gráfico.',
  },
  errors: {
    requestFailed: 'No se pudo completar la solicitud. Inténtalo de nuevo.',
    noResponse: 'El servidor no devolvió una respuesta.',
    copyFailed: 'No se pudo copiar el mensaje.',
  },
} as const;
