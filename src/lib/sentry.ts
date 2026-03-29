import * as Sentry from "@sentry/react";

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    enabled: import.meta.env.PROD,
    environment: import.meta.env.MODE,

    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    tracesSampleRate: 0.1,

    ignoreErrors: [
      "ResizeObserver loop",
      "ResizeObserver loop completed with undelivered notifications",
      "Non-Error promise rejection captured",
      /^Loading chunk \d+ failed/,
      /^Loading CSS chunk \d+ failed/,
      "Network request failed",
      "Failed to fetch",
      "AbortError",
      "TypeError: NetworkError",
      "TypeError: cancelled",
    ],

    beforeSend(event) {
      const isAuth = event.exception?.values?.some(
        (v) =>
          v.value &&
          /not authenticated|jwt expired|session expired|auth session missing|unauthorized/i.test(
            v.value
          )
      );
      if (isAuth) return null;
      return event;
    },
  });
}
