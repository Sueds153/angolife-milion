import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

/**
 * Initializes Sentry for error tracking and performance monitoring.
 * Requires VITE_SENTRY_DSN in .env
 */
export const initSentry = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.warn("Sentry DSN not found. Monitoring is disabled.");
    return;
  }

  Sentry.init({
    dsn,
    integrations: [new BrowserTracing()],
    
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

export const captureError = (error: any, context?: any) => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error("Error captured:", error, context);
  }
};
