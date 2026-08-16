import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../utils/errors';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  // Handle Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0];
    const friendlyMessages: Record<string, string> = {
      username: 'A user with this username already exists.',
      plateNumber: 'A vehicle with this plate number already exists.',
      licenseNumber: 'A driver with this license number already exists.',
    };
    res.status(409).json({
      success: false,
      message: friendlyMessages[field] || `Duplicate value for ${field}.`,
    });
    return;
  }

  // Handle Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values((err as any).errors).map((e: any) => e.message);
    res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  // Handle Mongoose cast error
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
    return;
  }

  // Handle custom app errors
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      message: err.message,
    };
    if (err instanceof ValidationError && err.errors.length > 0) {
      response.errors = err.errors;
    }
    res.status(err.statusCode).json(response);
    return;
  }

  // Unhandled errors
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
