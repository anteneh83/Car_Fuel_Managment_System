import mongoose, { Schema, Document } from 'mongoose';
import { FuelType, FuelRequestStatus } from '../types';

export interface IOdometerImage {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  originalFilename: string;
  uploadedAt: Date;
}

export interface IFuelRequest extends Document {
  driverId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  monitorId: mongoose.Types.ObjectId;
  fuelType: FuelType;
  fuelQuantity: number;
  pricePerLiter: number;
  odometerReading: number;
  odometerImage: IOdometerImage;
  status: FuelRequestStatus;
  // Preliminary calculations (for Admin review)
  estimatedTotalAmount: number;
  distanceSincePrevious: number;
  estimatedExpectedFuel: number;
  estimatedVariance: number;
  previousOdometer: number;
  // Approval/Rejection
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OdometerImageSchema = new Schema<IOdometerImage>(
  {
    secureUrl: { type: String, required: true },
    publicId: { type: String, required: true },
    resourceType: { type: String, required: true },
    format: { type: String, required: true },
    originalFilename: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const FuelRequestSchema = new Schema<IFuelRequest>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    monitorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fuelType: {
      type: String,
      enum: Object.values(FuelType),
      required: true,
    },
    fuelQuantity: {
      type: Number,
      required: true,
      min: [0.1, 'Fuel quantity must be positive'],
    },
    pricePerLiter: {
      type: Number,
      required: true,
      min: [0.01, 'Price per liter must be positive'],
    },
    odometerReading: {
      type: Number,
      required: true,
      min: 0,
    },
    odometerImage: {
      type: OdometerImageSchema,
      required: [true, 'Odometer image is mandatory'],
    },
    status: {
      type: String,
      enum: Object.values(FuelRequestStatus),
      default: FuelRequestStatus.PENDING,
    },
    // Preliminary calculations
    estimatedTotalAmount: {
      type: Number,
      default: 0,
    },
    distanceSincePrevious: {
      type: Number,
      default: 0,
    },
    estimatedExpectedFuel: {
      type: Number,
      default: 0,
    },
    estimatedVariance: {
      type: Number,
      default: 0,
    },
    previousOdometer: {
      type: Number,
      default: 0,
    },
    // Approval fields
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    // Rejection fields
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

FuelRequestSchema.index({ status: 1 });
FuelRequestSchema.index({ monitorId: 1 });
FuelRequestSchema.index({ vehicleId: 1 });
FuelRequestSchema.index({ driverId: 1 });
FuelRequestSchema.index({ createdAt: -1 });

export const FuelRequest = mongoose.model<IFuelRequest>('FuelRequest', FuelRequestSchema);
