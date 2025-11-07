import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { setupSocketHandlers } from './socket/handlers';
import { initializeDatabase } from './database/init';
import { initializeRedis } from './services/redis';
import { initializeJobQueues } from './jobs/queues';

// Routes
import agentRoutes from './routes/agent';
import fleetRoutes from './routes/fleet';
import systemsRoutes from './routes/systems';
import contractsRoutes from './routes/contracts';
import marketRoutes from './routes/market';
import tradingRoutes from './routes/trading';
import analyticsRoutes from './routes/analytics';
import automationRoutes from './routes/automation';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // SpaceTraders API rate limit
  message: 'API rate limit exceeded, please wait before making more requests.'
});

app.use('/api/', limiter);
app.use('/api/spacetraders/', apiLimiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/agent', agentRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/systems', systemsRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/automation', automationRoutes);

// Static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../client/build'));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile('index.html', { root: '../client/build' });
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

// Socket.io setup
setupSocketHandlers(io);

// Initialize services
async function initializeServices() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized successfully');

    // Initialize Redis
    await initializeRedis();
    logger.info('Redis connection established');

    // Initialize job queues
    await initializeJobQueues();
    logger.info('Job queues initialized');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  await initializeServices();

  httpServer.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🔗 Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
    logger.info(`📡 SpaceTraders API: ${process.env.SPACETRADERS_API_URL || 'https://api.spacetraders.io/v2'}`);
    
    if (process.env.NODE_ENV === 'development') {
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    }
  });
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export { app, io };
