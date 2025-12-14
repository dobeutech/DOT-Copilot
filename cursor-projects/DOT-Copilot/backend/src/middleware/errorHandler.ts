import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logError } from '../services/logger';
import { captureException } from '../services/sentry';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logError('Request error', err, {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
  });

  // Send to Sentry
  captureException(err instanceof Error ? err : new Error(String(err)));

  // Handle known error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle Prisma errors
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'A record with this value already exists',
        code: 'DUPLICATE_ENTRY',
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Record not found',
        code: 'NOT_FOUND',
      });
    }

    return res.status(400).json({
      error: 'Database error',
      code: 'DATABASE_ERROR',
    });
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Invalid data provided',
      code: 'VALIDATION_ERROR',
    });
  }

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  res.status(statusCode).json({
    error: message,
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

