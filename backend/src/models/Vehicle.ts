import mongoose, { Schema, Document } from 'mongoose';
import { VehicleStatus, FuelType } from '../types';

export interface IVehicle extends Omit<Document, 'model'> {
  plateNumber: string;
  vehicleName: string;
  brand: string;
  model: string;
  manufacturingYear: number;
  fuelType: FuelType;
  tankCapacity: number;
  averageFuelConsumption: number; // km per liter
  currentOdometer: number;
  status: VehicleStatus;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    plateNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicleName: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    manufacturingYear: {
      type: Number,
      required: true,
    },
    fuelType: {
      type: String,
      enum: Object.values(FuelType),
      required: true,
    },
    tankCapacity: {
      type: Number,
      required: true,
      min: [1, 'Tank capacity must be positive'],
    },
    averageFuelConsumption: {
      type: Number,
      required: true,
      min: [0.1, 'Average fuel consumption must be positive'],
    },
    currentOdometer: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(VehicleStatus),
      default: VehicleStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
