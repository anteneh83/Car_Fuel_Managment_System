import multer from 'multer';
import path from 'path';
import { config } from '../config';
import { AppError } from '../utils/errors';

const storage = multer.memoryStorage();

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!config.allowedFileTypes.includes(file.mimetype) || !config.allowedExtensions.includes(ext)) {
    cb(new AppError('Invalid file type. Allowed: JPG, JPEG, PNG, WEBP, PDF', 400));
    return;
  }
  cb(null, true);
};

export const uploadReceipt = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
});
