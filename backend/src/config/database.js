import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure backend/.env is loaded even when node is started from repo root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const buildDbConfigFromEnv = () => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    try {
      const parsed = new URL(databaseUrl);
      const database = parsed.pathname?.replace(/^\//, '');

      if (!database) {
        throw new Error('DATABASE_URL is missing database name');
      }

      return {
        host: parsed.hostname,
        user: decodeURIComponent(parsed.username || ''),
        password: decodeURIComponent(parsed.password || ''),
        database,
        port: parsed.port ? Number(parsed.port) : 3306,
      };
    } catch (error) {
      logger.warn(`Invalid DATABASE_URL, falling back to DB_* vars: ${error.message}`);
    }
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fieldsync',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  };
};

const dbConfig = buildDbConfigFromEnv();

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_POOL_SIZE || '25', 10),
  maxIdle: parseInt(process.env.DB_POOL_MAX_IDLE || '10', 10),
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ Successfully connected to MySQL database.');
    connection.release();
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

export default pool;
