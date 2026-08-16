import mongoose, { Schema, Document } from 'mongoose';
import { NotificationType } from '../types';

export interface INotification extends Document {
  recipientUserId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedTransactionId?: mongoose.Types.ObjectId;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedTransactionId: { type: Schema.Types.ObjectId, ref: 'FuelTransaction', default: null },
    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

NotificationSchema.index({ recipientUserId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
