import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

if (process.env.SENTRY_DSN) {
  try {
    const Sentry = await import('@sentry/node');
    const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

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
  } catch (err) {
    console.warn('Sentry failed to load:', err.message);
  }
}
