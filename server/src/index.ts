import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { requestLogger, logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

import agentRoutes from './routes/agent';
import fleetRoutes from './routes/fleet';
import systemsRoutes from './routes/systems';
import contractsRoutes from './routes/contracts';

dotenv.config();

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/agent', agentRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/systems', systemsRoutes);
app.use('/api/contracts', contractsRoutes);

app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;

app.listen(port, () => {
  logger.info(`Server listening on port ${port}`);
});
