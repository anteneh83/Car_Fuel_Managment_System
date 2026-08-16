import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import vehicleRoutes from './routes/vehicle.routes';
import driverRoutes from './routes/driver.routes';
import fuelTransactionRoutes from './routes/fuelTransaction.routes';
import { dashboardRoutes, fraudRoutes, notificationRoutes, auditRoutes } from './routes/dashboard.routes';

const app = express();

// Security
app.use(helmet());

// Dynamic CORS configuration for local dev and Vercel deployments
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow configured origins, any *.vercel.app domain, or non-production requests
    if (
      allowedOrigins.includes(origin) ||
      /\.vercel\.app$/.test(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }

    return callback(new Error(`CORS policy violation: Origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Ensure DB connection for serverless / Vercel calls
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/drivers', driverRoutes);
app.use('/api/v1/fuel-transactions', fuelTransactionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/fraud-alerts', fraudRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'FFFDMS API is running', timestamp: new Date() });
});

// Root route for Vercel
app.get('/', (_req, res) => {
  res.json({ success: true, message: 'FFFDMS Backend API (Vercel Serverless)' });
});

// Error handler
app.use(errorHandler);

// Start server locally (if not running in Vercel serverless environment)
if (!process.env.VERCEL) {
  const start = async () => {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`🚀 FFFDMS Backend running on port ${config.port}`);
    });
  };
  start();
}

export default app;
