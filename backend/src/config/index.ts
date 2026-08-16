import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/fffdms',
  jwtSecret: process.env.JWT_SECRET || 'default-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  owner: {
    username: process.env.OWNER_USERNAME || 'admin',
    password: process.env.OWNER_PASSWORD || 'Admin@12345',
  },
  workingHours: {
    start: 8,  // 08:00
    end: 18,   // 18:00
  },
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
};
