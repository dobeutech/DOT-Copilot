import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import services first
import { initSentry, captureException, Sentry } from './services/sentry';
import { logInfo, logError } from './services/logger';
import { initApplicationInsights } from './services/applicationInsights';
import { requestLogger, errorLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { performanceMiddleware } from './utils/performance';

// Initialize monitoring services
initSentry();
initApplicationInsights();

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import fleetRoutes from './routes/fleets';
import trainingProgramRoutes from './routes/trainingPrograms';
import moduleRoutes from './routes/modules';
import lessonRoutes from './routes/lessons';
import assignmentRoutes from './routes/assignments';
import notificationRoutes from './routes/notifications';
import completionRecordRoutes from './routes/completionRecords';
import quizRoutes from './routes/quizzes';
import uploadRoutes from './routes/uploads';
import docsRoutes from './routes/docs';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: { error: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Performance monitoring
app.use(performanceMiddleware);

// Request logging
app.use(requestLogger);

// Health check endpoints
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.get('/health/ready', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const prismaModule = await import('@prisma/client');
    const PrismaClientClass = prismaModule.PrismaClient;
    const prisma = new PrismaClientClass();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();

    res.json({ 
      status: 'ready',
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready',
      database: 'disconnected',
    });
  }
});

app.get('/health/live', (req: Request, res: Response) => {
  res.json({ status: 'alive' });
});

// Metrics endpoint (protected in production)
app.get('/metrics', (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production' && !req.headers.authorization) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { getMetrics } = require('./utils/performance');
  res.json({ metrics: getMetrics() });
});

// API Documentation
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true') {
  app.use('/api-docs', docsRoutes);
  logInfo('API documentation available at /api-docs');
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/fleets', fleetRoutes);
app.use('/api/training-programs', trainingProgramRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/completion-records', completionRecordRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/uploads', uploadRoutes);

// Error logging middleware
app.use(errorLogger);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logInfo(`Received ${signal}, shutting down gracefully...`);
  
  // Close server
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception', error);
  captureException(error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection', reason as Error);
  if (reason instanceof Error) {
    captureException(reason);
  }
});

app.listen(PORT, () => {
  logInfo(`Server started`, { port: PORT, env: process.env.NODE_ENV || 'development' });
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
