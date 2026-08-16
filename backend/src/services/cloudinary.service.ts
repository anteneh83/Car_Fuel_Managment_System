import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { config } from '../config';
import { CloudinaryMetadata } from '../types';
import { AppError } from '../utils/errors';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export class CloudinaryService {
  /**
   * Upload a receipt to Cloudinary.
   */
  static async uploadReceipt(
    fileBuffer: Buffer,
    originalFilename: string,
    mimetype: string
  ): Promise<CloudinaryMetadata> {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const folder = `fffdms/receipts/${year}/${month}`;

      const isPdf = mimetype === 'application/pdf';
      const resourceType = isPdf ? 'raw' : 'image';

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType as any,
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!);
          }
        );
        stream.end(fileBuffer);
      });

      return {
        secureUrl: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
        format: result.format || (isPdf ? 'pdf' : ''),
        originalFilename,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new AppError('Receipt upload failed. Please try again.', 500);
    }
  }

  /**
   * Delete a receipt from Cloudinary.
   */
  static async deleteReceipt(publicId: string, resourceType: string = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType as any,
      });
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      // Don't throw - best effort cleanup
    }
  }

  /**
   * Replace a receipt: upload new, delete old.
   */
  static async replaceReceipt(
    oldPublicId: string,
    oldResourceType: string,
    newFileBuffer: Buffer,
    newOriginalFilename: string,
    newMimetype: string
  ): Promise<CloudinaryMetadata> {
    const newMetadata = await this.uploadReceipt(newFileBuffer, newOriginalFilename, newMimetype);
    // Only delete old after successful upload
    await this.deleteReceipt(oldPublicId, oldResourceType);
    return newMetadata;
  }
}
