import { httpServer } from './app.js';
import { initializeDatabase } from './db/init.js';
import { runMigrations } from './db/migrate.js';
import { cleanupOldData } from './utils/cleanupData.js';
import logger from './utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, '../..');

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

async function initDatabase() {
  const allowDestructiveInit = process.env.DB_RESET_ON_INIT === 'true';
  if (allowDestructiveInit) {
    logger.warn('DB_RESET_ON_INIT is set! Running destructive database initialization...');
    await initializeDatabase({ allowDestructive: true });
  } else {
    logger.info('Running database migrations...');
    await runMigrations();
  }
}

async function initFrontend() {
  if (!isProduction) return;
  logger.info('Starting Next.js Frontend (Production)...');
  const nextServer = (await import('next')).default;
  const nextApp = nextServer({ dev: false, dir: frontendDir });
  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  const { app: expressApp } = await import('./app.js');

  expressApp.all('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api/v1')) return next();
    return handle(req, res);
  });

  logger.info('Next.js Frontend mounted');
}

const startServer = async () => {
  httpServer.listen(PORT, () => {
    logger.info(`Server listening at http://localhost:${PORT}`);
    logger.info(`Mode: ${process.env.NODE_ENV || 'development'}`);

    cleanupOldData();
    setInterval(() => cleanupOldData(), 6 * 60 * 60 * 1000);
  });

  initDatabase()
    .then(() => logger.info('Database initialized'))
    .catch((error) => {
      logger.error('Database initialization failed (server running in degraded mode):', error);
    });

  initFrontend()
    .then(() => logger.info('Frontend initialized'))
    .catch((error) => {
      logger.error('Frontend initialization failed (API-only mode):', error);
    });
};

startServer();
