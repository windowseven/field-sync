import logger from './logger.js';

export function asyncHandler(fn) {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch((error) => {
      const statusCode = error.statusCode || 500;

      logger.error(`${error.name}: ${error.message}`);
      if (error.stack && process.env.NODE_ENV === 'development') {
        logger.debug(error.stack);
      }

      res.status(statusCode).json({
        status: 'error',
        message: statusCode === 500
          ? 'Internal Server Error'
          : error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      });
    });
  };
}
