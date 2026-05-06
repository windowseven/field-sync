import { httpServer } from './app.js';
import { initializeDatabase } from './db/init.js';
import logger from './utils/logger.js';

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

const startServer = async () => {
  try {
    const allowDestructiveInit = process.env.DB_RESET_ON_INIT === 'true';

    // 1. Initialize Database (Schema)
    logger.info('Initializing database...');
    await initializeDatabase({ allowDestructive: allowDestructiveInit });
    logger.info('Database initialized successfully.');

    // 2. Start Next.js Frontend (Only in Production)
    if (isProduction) {
      logger.info('🖥️  Starting Next.js Frontend (Production)...');
      const next = (await import('next')).default;
      const nextApp = next({ dev: false, dir: '../frontend' });
      const handle = nextApp.getRequestHandler();
      await nextApp.prepare();

      const { app: expressApp } = await import('./app.js');
      
      // Mount Next.js handler *after* API routes but *before* 404s
      // Note: This requires the Next.js build to be in ../frontend/.next
      // In a Render build step, we ensure this happens.
      expressApp.all('*', (req, res) => {
        if (req.originalUrl.startsWith('/api/v1')) return next();
        return handle(req, res);
      });
    }

    // 3. Start HTTP & WebSocket Server
    httpServer.listen(PORT, () => {
      logger.info(`⚡️[server]: Professional FieldSync Backend is running at http://localhost:${PORT}`);
      logger.info(`🚀 Mode: ${process.env.NODE_ENV || 'development'}`);
      if (isProduction) logger.info(`🌐 Frontend: Integrated via Next.js Standalone`);
    });
  } catch (error) {
    logger.error('CRITICAL: Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
