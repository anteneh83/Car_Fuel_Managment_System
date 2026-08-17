import mongoose, { Schema, Document } from 'mongoose';
import { FuelType, TransactionStatus, ReviewStatus, RiskLevel } from '../types';

export interface IReceiptImage {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  originalFilename: string;
  uploadedAt: Date;
}

export interface IFuelTransaction extends Document {
  fuelRequestId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  monitorId: mongoose.Types.ObjectId;
  fuelStationName: string;
  fuelType: FuelType;
  fuelQuantity: number;
  pricePerLiter: number;
  totalAmount: number;
  odometerReading: number;
  previousOdometer: number;
  distanceTraveled: number;
  expectedFuel: number;
  fuelDifference: number;
  variancePercentage: number;
  receiptNumber: string;
  receiptImage?: IReceiptImage;
  fuelDate: Date;
  submittedAt: Date;
  status: TransactionStatus;
  riskScore: number;
  riskLevel: RiskLevel;
  fraudReasons: string[];
  reviewStatus: ReviewStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  investigationNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptImageSchema = new Schema<IReceiptImage>(
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

const FuelTransactionSchema = new Schema<IFuelTransaction>(
  {
    fuelRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'FuelRequest',
      required: true,
    },
    vehicleId: {
      type: Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
    },
    monitorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fuelStationName: {
      type: String,
      required: true,
      trim: true,
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
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    odometerReading: {
      type: Number,
      required: true,
      min: 0,
    },
    previousOdometer: {
      type: Number,
      required: true,
      min: 0,
    },
    distanceTraveled: {
      type: Number,
      default: 0,
    },
    expectedFuel: {
      type: Number,
      default: 0,
    },
    fuelDifference: {
      type: Number,
      default: 0,
    },
    variancePercentage: {
      type: Number,
      default: 0,
    },
    receiptNumber: {
      type: String,
      required: true,
      trim: true,
    },
    receiptImage: {
      type: ReceiptImageSchema,
      default: null,
    },
    fuelDate: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      default: TransactionStatus.NORMAL,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      default: RiskLevel.LOW,
    },
    fraudReasons: {
      type: [String],
      default: [],
    },
    reviewStatus: {
      type: String,
      enum: Object.values(ReviewStatus),
      default: ReviewStatus.PENDING,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    investigationNotes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

FuelTransactionSchema.index({ fuelRequestId: 1 });
FuelTransactionSchema.index({ vehicleId: 1, fuelDate: 1 });
FuelTransactionSchema.index({ driverId: 1, fuelDate: 1 });
FuelTransactionSchema.index({ monitorId: 1 });
FuelTransactionSchema.index({ receiptNumber: 1 });
FuelTransactionSchema.index({ riskScore: -1 });
FuelTransactionSchema.index({ reviewStatus: 1 });

export const FuelTransaction = mongoose.model<IFuelTransaction>('FuelTransaction', FuelTransactionSchema);
