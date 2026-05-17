import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';
import logger from '../utils/logger.js';
import pool from '../config/database.js';
import { checkZoneBoundary } from '../utils/zoneBoundary.js';
import { checkInactivityAlerts } from '../utils/inactivityAlerts.js';

const clients = new Map();
const userClients = new Map();
const roleClients = new Map();
const MAX_CONNECTIONS = parseInt(process.env.WS_MAX_CONNECTIONS || '500', 10);
const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 10000;
const LOCATION_BROADCAST_THROTTLE_MS = parseInt(process.env.WS_LOCATION_THROTTLE_MS || '2000', 10);

let lastLocationBroadcast = 0;
const pendingLocationUpdates = new Map();

function safeJsonSend(ws, payload) {
  try {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(payload));
    }
  } catch {
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

function indexClient(ws, client) {
  clients.set(ws, client);

  let byUser = userClients.get(client.user.id);
  if (!byUser) {
    byUser = new Set();
    userClients.set(client.user.id, byUser);
  }
  byUser.add(ws);

  let byRole = roleClients.get(client.user.role);
  if (!byRole) {
    byRole = new Set();
    roleClients.set(client.user.role, byRole);
  }
  byRole.add(ws);
}

function deindexClient(ws, client) {
  clients.delete(ws);

  const byUser = userClients.get(client.user.id);
  if (byUser) {
    byUser.delete(ws);
    if (byUser.size === 0) userClients.delete(client.user.id);
  }

  const byRole = roleClients.get(client.user.role);
  if (byRole) {
    byRole.delete(ws);
    if (byRole.size === 0) roleClients.delete(client.user.role);
  }
}

function removeClient(ws) {
  const client = clients.get(ws);
  if (client) {
    deindexClient(ws, client);
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
      pendingLocationUpdates.set(client.user.id, {
        user_id: client.user.id,
        name: client.user.email,
        role: client.user.role,
        lat,
        lng,
        accuracy: acc,
        project_id,
        ts: now,
      });

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
  if (pendingLocationUpdates.size === 0) return;
  const updates = Array.from(pendingLocationUpdates.values());
  pendingLocationUpdates.clear();
  lastLocationBroadcast = Date.now();

  const targets = new Set();
  for (const role of ['admin', 'supervisor', 'team_leader']) {
    const byRole = roleClients.get(role);
    if (byRole) {
      for (const ws of byRole) targets.add(ws);
    }
  }
  for (const ws of targets) {
    safeJsonSend(ws, { type: 'location:batch', data: updates });
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
    if (pendingLocationUpdates.size > 0) {
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
    };

    indexClient(ws, client);
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
  const byUser = userClients.get(userId);
  if (!byUser) return;
  for (const ws of byUser) {
    safeJsonSend(ws, { type, data });
  }
}

export function broadcastToRoles(roles, type, data) {
  const targets = new Set();
  for (const role of roles) {
    const byRole = roleClients.get(role);
    if (byRole) {
      for (const ws of byRole) targets.add(ws);
    }
  }
  for (const ws of targets) {
    safeJsonSend(ws, { type, data });
  }
}

export function broadcast(type, data) {
  for (const [, client] of clients) {
    safeJsonSend(client.ws, { type, data });
  }
}

export function getConnectedClientsSnapshot() {
  const byRole = {};
  for (const [role, connections] of roleClients) {
    byRole[role] = connections.size;
  }
  return {
    total: clients.size,
    byRole,
  };
}
