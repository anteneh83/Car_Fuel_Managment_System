import mongoose, { Schema, Document } from 'mongoose';
import { DriverStatus } from '../types';

export interface IDriver extends Document {
  fullName: string;
  phoneNumber: string;
  licenseNumber: string;
  assignedVehicleId?: mongoose.Types.ObjectId;
  status: DriverStatus;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    assignedVehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(DriverStatus),
      default: DriverStatus.ACTIVE,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);
