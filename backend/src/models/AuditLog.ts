import mongoose, { Schema, Document } from 'mongoose';
import { AuditAction } from '../types';

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId;
  userRole: string;
  action: AuditAction;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userRole: { type: String, required: true },
    action: { type: String, enum: Object.values(AuditAction), required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ userId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
