import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: UserRole;
  driverId?: mongoose.Types.ObjectId;
  isActive: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return password hash by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any).passwordHash;
        return ret;
      },
    },
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
