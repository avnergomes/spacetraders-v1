import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from './errorHandler';

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const expectedToken = env.spaceTradersToken;

  if (!expectedToken) {
    next(new HttpError(500, 'SpaceTraders token is not configured.'));
    return;
  }

  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    next(new HttpError(401, 'Authorization header is required.'));
    return;
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || token !== expectedToken) {
    next(new HttpError(403, 'Invalid bearer token.'));
    return;
  }

  next();
};
