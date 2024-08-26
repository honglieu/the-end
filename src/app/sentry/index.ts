import { ErrorHandler } from '@angular/core';
import * as Sentry from '@sentry/angular-ivy';
import { sentryConfig, env } from 'src/environments/environment';

export const initSentry = () => {
  if (!sentryConfig.init) {
    return;
  }

  try {
    Sentry.init({
      dsn: sentryConfig.dsn,
      environment: env,
      release: '1721205672338',
      integrations: [
        new Sentry.BrowserProfilingIntegration(),
        new Sentry.BrowserTracing({
          routingInstrumentation: Sentry.routingInstrumentation,
          tracePropagationTargets: [
            'https://console.trudi.ai',
            'https://portal.trudi.ai',
            'https://api.prod.trudi.ai',
            'https://us.console.trudi.ai',
            'https://us.portal.trudi.ai',
            'https://us.api.trudi.ai',
            'https://console.preprod.trudi.ai',
            'https://portal.preprod.trudi.ai',
            'https://api.preprod.trudi.ai',
            'https://console.stage.trudi.ai',
            'https://portal.stage.trudi.ai',
            'https://api.stage.trudi.ai',
            'https://console.attic.trulet.com',
            'https://portal.attic.trulet.com',
            'https://api.attic.trulet.com'
          ],
          idleTimeout: 15000
        }),
        new Sentry.Replay()
      ],
      tracesSampleRate: sentryConfig.tracesSampleRate,
      replaysSessionSampleRate: sentryConfig.replaysSessionSampleRate,
      replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,
      sampleRate: 0.5
      // profilesSampleRate: 0.5
    });
  } catch (e) {
    console.error(e);
  }
};

class SentryErrorHandler implements ErrorHandler {
  constructor() {
    initSentry();
  }

  handleError(error: any) {
    Sentry.captureException(error.originalError || error.error || error, {
      level: 'error'
    });
  }
}

export function getErrorHandler(): ErrorHandler {
  return !sentryConfig.init ? new ErrorHandler() : new SentryErrorHandler();
}

export const captureExceptionToSentry = Sentry.captureException;
