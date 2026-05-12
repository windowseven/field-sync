import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    sendDefaultPii: true,
    enableLogs: true,
    includeLocalVariables: true,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profileSessionSampleRate: 1.0,
    profileLifecycle: 'trace',
    integrations: [
      nodeProfilingIntegration(),
      Sentry.nodeRuntimeMetricsIntegration(),
    ],
  });
}
