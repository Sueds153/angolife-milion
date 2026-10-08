import * as Sentry from "@sentry/react";

/**
 * DSN público por definição (o Sentry expõe-o no bundle de qualquer forma).
 * O override por variável de ambiente continua a ter prioridade.
 */
const FALLBACK_DSN =
  "https://5f746ce416d74c6abd7094ca9a26cb97@o4511645656809472.ingest.de.sentry.io/4511645674242128";

const resolveDsn = (): string => import.meta.env.VITE_SENTRY_DSN || FALLBACK_DSN;

/**
 * Initializes Sentry for error tracking and performance monitoring.
 * Uses VITE_SENTRY_DSN when set, otherwise the project DSN above.
 */
export const initSentry = () => {
  const dsn = resolveDsn();

  if (!dsn) {
    console.warn("Sentry DSN not found. Monitoring is disabled.");
    return;
  }

  Sentry.init({
    dsn,
    integrations: [Sentry.browserTracingIntegration()],
    
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions (adjust for production)
    
    // Environment
    environment: import.meta.env.MODE,
    
    // Filter out common browser extension errors or local dev noise
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "NetworkError when attempting to fetch resource"
    ],
  });

  console.log("Sentry monitoring initialized.");
};

export const captureError = (error: unknown, context?: unknown) => {
  if (resolveDsn()) {
    Sentry.captureException(error, context ? { extra: { context } } : undefined);
  } else {
    console.error("Error captured:", error, context);
  }
};
