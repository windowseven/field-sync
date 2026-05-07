import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors.map(e => e.message)
      });
    }
    next(error);
  }
};

// Predefined schemas for common endpoints
export const schemas = {
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  }),
  register: z.object({
    body: z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      first_name: z.string().min(1).optional(),
      role: z.enum(['field_agent', 'supervisor']).optional()
    })
  }),
  projectCreate: z.object({
    body: z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      status: z.enum(['active', 'paused', 'draft', 'archived']).optional(),
      location: z.string().optional()
    })
  })
};

