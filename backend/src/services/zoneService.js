import pool from '../config/database.js';

export function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function parseBoundaries(raw) {
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function getZonesForUser(userId) {
  const [rows] = await pool.query(
    `SELECT DISTINCT z.id, z.name, z.boundaries
     FROM tasks t
     JOIN zones z ON t.zone_id = z.id
     WHERE t.assigned_to = ? AND t.status IN ('pending', 'in-progress') AND z.boundaries IS NOT NULL`,
    [userId]
  );
  return rows;
}
