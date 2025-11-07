import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { env } from './config/env';
import { requestLogger, logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

import agentRoutes from './routes/agent';
import fleetRoutes from './routes/fleet';
import systemsRoutes from './routes/systems';
import contractsRoutes from './routes/contracts';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', agentRoutes);
app.use('/api', fleetRoutes);
app.use('/api', systemsRoutes);
app.use('/api', contractsRoutes);

app.use(errorHandler);

const port = env.port;

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
app.use(express.json())

app.use((req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') || process.env.SPACETRADERS_TOKEN
  if (!token) return res.status(401).json({ error: 'Token não fornecido.' })
  req.headers.authorization = `Bearer ${token}`
  next()
})

