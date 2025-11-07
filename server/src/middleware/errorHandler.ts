import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

interface ErrorResponse {
  status: number;
  message: string;
  details?: unknown;
}

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const errorHandler = (err: Error | HttpError, _req: Request, res: Response, _next: NextFunction): void => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(message, err instanceof HttpError ? { status, details: err.details } : undefined);

  const response: ErrorResponse = { status, message };
  if (process.env.NODE_ENV !== 'production' && err instanceof HttpError && err.details) {
    response.details = err.details;
  }

  res.status(status).json(response);
};
