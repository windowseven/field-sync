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

const startServer = async () => {
  try {
    const allowDestructiveInit = process.env.DB_RESET_ON_INIT === 'true';

    if (allowDestructiveInit) {
      logger.warn('⚠️  DB_RESET_ON_INIT is set! Running destructive database initialization...');
      await initializeDatabase({ allowDestructive: true });
    } else {
      // Safe mode: run versioned migrations
      logger.info('Running database migrations...');
      await runMigrations();
    }

    // 2. Start Next.js Frontend (Only in Production)
    if (isProduction) {
      logger.info('🖥️  Starting Next.js Frontend (Production)...');
      const nextServer = (await import('next')).default;
      const nextApp = nextServer({ dev: false, dir: frontendDir });
      const handle = nextApp.getRequestHandler();
      await nextApp.prepare();

      const { app: expressApp } = await import('./app.js');
      
      // Mount Next.js handler *after* API routes but *before* 404s
      expressApp.all('*', (req, res, next) => {
        if (req.originalUrl.startsWith('/api/v1')) return next();
        return handle(req, res);
      });
    }

    // 3. Start HTTP & WebSocket Server
    httpServer.listen(PORT, () => {
      logger.info(`⚡️[server]: Professional FieldSync Backend is running at http://localhost:${PORT}`);
      logger.info(`🚀 Mode: ${process.env.NODE_ENV || 'development'}`);
      if (isProduction) logger.info(`🌐 Frontend: Integrated via Next.js Standalone`);

      // Run initial data cleanup, then schedule every 6 hours
      cleanupOldData();
      setInterval(() => cleanupOldData(), 6 * 60 * 60 * 1000);
    });
  } catch (error) {
    logger.error('CRITICAL: Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
