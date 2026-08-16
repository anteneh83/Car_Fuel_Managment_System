import { AuditLog } from '../models/AuditLog';
import { AuditAction } from '../types';
import mongoose from 'mongoose';

export class AuditLogService {
  static async log(params: {
    userId: string | mongoose.Types.ObjectId;
    userRole: string;
    action: AuditAction;
    entityType: string;
    entityId?: string | mongoose.Types.ObjectId;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      // Sanitize - never log passwords or secrets
      const sanitize = (obj: any) => {
        if (!obj) return obj;
        const sanitized = { ...obj };
        const sensitiveFields = ['passwordHash', 'password', 'tempPassword', 'apiSecret', 'jwtSecret'];
        sensitiveFields.forEach(field => {
          if (sanitized[field]) sanitized[field] = '[REDACTED]';
        });
        return sanitized;
      };

      await AuditLog.create({
        userId: params.userId,
        userRole: params.userRole,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        oldValue: sanitize(params.oldValue),
        newValue: sanitize(params.newValue),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      console.error('Audit log creation failed:', error);
      // Don't throw - audit logging should not break operations
    }
  }

  static async getAll(query: {
    page?: number;
    limit?: number;
    action?: string;
    userId?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 20, action, userId, entityType, startDate, endDate } = query;
    const filter: any = {};

    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (entityType) filter.entityType = entityType;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'username role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getById(id: string) {
    return AuditLog.findById(id).populate('userId', 'username role');
  }
}
