import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  debug: process.env.NODE_ENV !== 'production',
});
