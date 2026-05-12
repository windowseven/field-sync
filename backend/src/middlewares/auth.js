import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import { getPlatformControls } from '../utils/platformConfigStore.js';
import { isBlacklisted } from '../utils/tokenBlacklist.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.'
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ status: 'error', message: 'Server configuration error' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.jti && isBlacklisted(decoded.jti)) {
      return res.status(401).json({
        status: 'error',
        message: 'Token has been revoked. Please log in again.'
      });
    }

    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };
    req.tokenJti = decoded.jti;
    next();
  } catch (error) {
    logger.error('Invalid token:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token.'
    });
  }
};

export const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Permission denied. You do not have the required role.'
      });
    }
    next();
  };
};

export const enforcePlatformControls = async (req, res, next) => {
  try {
    const controls = await getPlatformControls();

    if (controls.platformLocked && req.user?.role !== 'admin') {
      return res.status(503).json({
        status: 'error',
        code: 'PLATFORM_LOCKED',
        message: 'The platform has been locked by an administrator. All sessions have been invalidated.',
      });
    }

    if (controls.maintenanceMode && req.user?.role !== 'admin') {
      return res.status(503).json({
        status: 'error',
        code: 'MAINTENANCE_MODE',
        message: 'The platform is currently under maintenance. Please try again later.',
      });
    }

    next();
  } catch (error) {
    logger.error('Platform controls check error:', error);
    next();
  }
};
