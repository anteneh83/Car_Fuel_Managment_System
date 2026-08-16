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
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
}));

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

// Error handler
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`🚀 FFFDMS Backend running on port ${config.port}`);
  });
};

start();

export default app;
