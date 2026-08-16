import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { NotificationType, UserRole } from '../types';
import mongoose from 'mongoose';

export class NotificationService {
  /**
   * Create a notification for the owner
   */
  static async notifyOwner(params: {
    type: NotificationType;
    title: string;
    message: string;
    relatedTransactionId?: string | mongoose.Types.ObjectId;
  }): Promise<void> {
    try {
      // Find owner user(s)
      const owners = await User.find({ role: UserRole.OWNER, isActive: true });
      
      for (const owner of owners) {
        await Notification.create({
          recipientUserId: owner._id,
          type: params.type,
          title: params.title,
          message: params.message,
          relatedTransactionId: params.relatedTransactionId || null,
        });
      }
    } catch (error) {
      console.error('Notification creation failed:', error);
    }
  }

  static async getForUser(userId: string, query: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const { page = 1, limit = 20, unreadOnly } = query;
    const filter: any = { recipientUserId: userId };
    if (unreadOnly) filter.isRead = false;

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ recipientUserId: userId, isRead: false });

    return {
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async markAsRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipientUserId: userId },
      { isRead: true },
      { new: true }
    );
  }

  static async markAllAsRead(userId: string) {
    return Notification.updateMany(
      { recipientUserId: userId, isRead: false },
      { isRead: true }
    );
  }
}
