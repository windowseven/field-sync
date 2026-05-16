import logger from './logger.js';

export function asyncHandler(fn) {
  return (req, res, next) => {
    return Promise.resolve(fn(req, res, next)).catch((error) => {
      if (error.name === 'ZodError') {
        res.status(400).json({
          status: 'error',
          message: error.errors?.[0]?.message || 'Validation error',
        });
        return;
      }

      const statusCode = error.statusCode || 500;

      logger.error(`${error.name}: ${error.message}`);
      if (error.stack && process.env.NODE_ENV === 'development') {
        logger.debug(error.stack);
      }

      if (statusCode === 500) {
        console.error(`${new Date().toISOString()} [${error.name}] ${error.message}`);
        if (error.stack) console.error(error.stack);
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
