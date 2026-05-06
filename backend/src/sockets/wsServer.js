import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
import logger from '../utils/logger.js';
import pool from '../config/database.js';
import { checkZoneBoundary } from '../utils/zoneBoundary.js';
import { checkInactivityAlerts } from '../utils/inactivityAlerts.js';

const clients = new Map();
const MAX_CONNECTIONS = parseInt(process.env.WS_MAX_CONNECTIONS || '500', 10);
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 10000;
const LOCATION_BROADCAST_THROTTLE_MS = parseInt(process.env.WS_LOCATION_THROTTLE_MS || '2000', 10);

let lastLocationBroadcast = 0;
let pendingLocationUpdate = null;

function safeJsonSend(ws, payload) {
  try {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(payload));
    }
  } catch {
    // ignore send failures
  }
}

function parseTokenFromRequest(req) {
  try {
    const url = new URL(req.url, 'http://localhost');
    return url.searchParams.get('token');
  } catch {
    return null;
  }
}

function verifyToken(token) {
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    logger.error('[WS] JWT_SECRET not configured — rejecting all connections');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret);
    return {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email,
    };
  } catch {
    return null;
  }
}

function removeClient(ws) {
  const client = clients.get(ws);
  if (client) {
    if (client.heartbeatTimer) clearInterval(client.heartbeatTimer);
    if (client.timeoutTimer) clearTimeout(client.timeoutTimer);
    clients.delete(ws);
    logger.info(`[WS] Disconnected ${client.user.email} (${client.user.role})`);
  }
}

async function handleClientMessage(client, raw) {
  let message;
  try {
    message = JSON.parse(raw.toString());
  } catch {
    return;
  }

  if (!message?.type) return;

  if (message.type === 'ping') {
    client.lastPong = Date.now();
    safeJsonSend(client.ws, { type: 'pong', data: { ts: Date.now() } });
    return;
  }

  if (message.type === 'pong') {
    client.lastPong = Date.now();
    return;
  }

  if (message.type === 'location:update') {
    const { lat, lng, accuracy, project_id } = message.data || {};
    if (lat == null || lng == null) return;

    const acc = accuracy ?? 15;

    try {
      await pool.query(
        `INSERT INTO user_locations (user_id, lat, lng, accuracy, updated_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), accuracy = VALUES(accuracy), updated_at = NOW()`,
        [client.user.id, lat, lng, acc]
      );

      await pool.query(
        'INSERT INTO user_location_history (id, user_id, lat, lng, accuracy, recorded_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [uuidv4(), client.user.id, lat, lng, acc]
      );

      await checkZoneBoundary(client.user.id, lat, lng);

      const now = Date.now();
      pendingLocationUpdate = {
        user_id: client.user.id,
        name: client.user.email,
        role: client.user.role,
        lat,
        lng,
        accuracy: acc,
        project_id,
        ts: now,
      };

      if (now - lastLocationBroadcast >= LOCATION_BROADCAST_THROTTLE_MS) {
        flushLocationBroadcast();
      }

      safeJsonSend(client.ws, { type: 'location:ack', data: { ts: Date.now() } });
    } catch (err) {
      logger.error('[WS] Location save error:', err.message);
    }
    return;
  }
}

function flushLocationBroadcast() {
  if (!pendingLocationUpdate) return;
  const data = pendingLocationUpdate;
  pendingLocationUpdate = null;
  lastLocationBroadcast = Date.now();

  const roleSet = new Set(['admin', 'supervisor', 'team_leader']);
  for (const [, client] of clients) {
    if (!roleSet.has(client.user.role)) continue;
    safeJsonSend(client.ws, { type: 'location:update', data });
  }
}

function startHeartbeatChecks() {
  setInterval(() => {
    const now = Date.now();
    for (const [ws, client] of clients) {
      if (!client.lastPong || now - client.lastPong > HEARTBEAT_TIMEOUT) {
        logger.warn(`[WS] Heartbeat timeout for ${client.user.email}, closing`);
        ws.terminate();
        removeClient(ws);
      } else {
        safeJsonSend(ws, { type: 'ping', data: { ts: now } });
      }
    }
  }, HEARTBEAT_INTERVAL);

  setInterval(() => {
    if (pendingLocationUpdate) {
      flushLocationBroadcast();
    }
  }, LOCATION_BROADCAST_THROTTLE_MS);

  setInterval(async () => {
    try {
      const alerts = await checkInactivityAlerts(15);
      if (alerts.length > 0) {
        logger.info(`[Inactivity] ${alerts.length} inactivity alerts generated`);
      }
    } catch (err) {
      logger.error('[Inactivity] Check failed:', err.message);
    }
  }, 5 * 60 * 1000);
}

let heartbeatStarted = false;

export function setupWsServer(httpServer) {
  const wss = new WebSocketServer({
    server: httpServer,
    path: '/ws',
    maxPayload: 65536,
  });

  wss.on('connection', (ws, req) => {
    if (clients.size >= MAX_CONNECTIONS) {
      safeJsonSend(ws, { type: 'overloaded', data: null });
      ws.close(1013, 'Server overloaded');
      return;
    }

    const token = parseTokenFromRequest(req);
    const user = verifyToken(token);

    if (!user) {
      safeJsonSend(ws, { type: 'unauthorized', data: null });
      ws.close(1008, 'Unauthorized');
      return;
    }

    const client = {
      ws,
      user,
      lastPong: Date.now(),
      heartbeatTimer: null,
      timeoutTimer: null,
    };

    clients.set(ws, client);
    logger.info(`[WS] Connected ${user.email} (${user.role}) — total: ${clients.size}`);

    safeJsonSend(ws, { type: 'connected', data: { userId: user.id, role: user.role } });

    ws.on('message', (data) => handleClientMessage(client, data));

    ws.on('close', () => removeClient(ws));

    ws.on('error', (err) => {
      logger.error(`[WS] Error for ${user.email}:`, err.message);
      removeClient(ws);
    });
  });

  if (!heartbeatStarted) {
    startHeartbeatChecks();
    heartbeatStarted = true;
  }

  return wss;
}

export function emitToUser(userId, type, data) {
  for (const [, client] of clients) {
    if (client.user.id !== userId) continue;
    safeJsonSend(client.ws, { type, data });
  }
}

export function broadcastToRoles(roles, type, data) {
  const roleSet = new Set(roles);
  for (const [, client] of clients) {
    if (!roleSet.has(client.user.role)) continue;
    safeJsonSend(client.ws, { type, data });
  }
}

export function broadcast(type, data) {
  for (const [, client] of clients) {
    safeJsonSend(client.ws, { type, data });
  }
}

export function getConnectedClientsSnapshot() {
  const byRole = {};

  for (const [, client] of clients) {
    byRole[client.user.role] = (byRole[client.user.role] || 0) + 1;
  }

  return {
    total: clients.size,
    byRole,
  };
}
