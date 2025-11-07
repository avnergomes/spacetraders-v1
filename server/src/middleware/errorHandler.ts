import { NextFunction, Request, Response } from 'express';
import { AxiosError } from 'axios';
import { env } from '../config/env';
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

type SpaceTradersError = {
  error?: {
    message?: string;
    code?: string | number;
    data?: unknown;
  };
};

export const errorHandler = (err: Error | HttpError | AxiosError<SpaceTradersError>, _req: Request, res: Response, _next: NextFunction): void => {
  const isHttpError = err instanceof HttpError;
  const axiosError = err as AxiosError<SpaceTradersError>;
  const isAxiosError = axiosError?.isAxiosError ?? false;

  const status = isHttpError
    ? err.status
    : isAxiosError
      ? axiosError.response?.status ?? 500
      : 500;

  const details = isHttpError
    ? err.details
    : isAxiosError
      ? axiosError.response?.data
      : undefined;

  const message = isHttpError
    ? err.message
    : isAxiosError
      ? axiosError.response?.data?.error?.message
        ?? axiosError.message
        ?? 'SpaceTraders API request failed'
      : err.message ?? 'Internal Server Error';

  logger.error(message, { status, details });

  const response: ErrorResponse = { status, message };
  if (env.nodeEnv !== 'production' && details) {
    response.details = details;
  }

  res.status(status).json(response);
};
