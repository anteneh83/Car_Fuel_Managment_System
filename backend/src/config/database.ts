import mongoose from 'mongoose';
import { config } from './index';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }
  try {
    const db = await mongoose.connect(config.mongodbUri);
    isConnected = db.connections[0].readyState === 1;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
};
