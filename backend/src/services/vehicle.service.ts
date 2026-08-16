import { Vehicle, IVehicle } from '../models/Vehicle';
import { FuelTransaction } from '../models/FuelTransaction';
import { VehicleStatus } from '../types';
import { NotFoundError, AppError, ConflictError } from '../utils/errors';

export class VehicleService {
  static async getAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    fuelType?: string;
  }) {
    const { page = 1, limit = 20, status, search, fuelType } = query;
    const filter: any = {};

    if (status) filter.status = status;
    if (fuelType) filter.fuelType = fuelType;
    if (search) {
      filter.$or = [
        { vehicleName: { $regex: search, $options: 'i' } },
        { plateNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Vehicle.countDocuments(filter);
    const vehicles = await Vehicle.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: vehicles,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    return vehicle;
  }

  static async create(data: Partial<IVehicle>) {
    if (!data.tankCapacity || data.tankCapacity <= 0) {
      throw new AppError('Tank capacity must be positive', 400);
    }
    if (!data.averageFuelConsumption || data.averageFuelConsumption <= 0) {
      throw new AppError('Average fuel consumption must be positive', 400);
    }
    return Vehicle.create(data);
  }

  static async update(id: string, data: Partial<IVehicle>) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    // Odometer cannot decrease
    if (data.currentOdometer !== undefined && data.currentOdometer < vehicle.currentOdometer) {
      throw new AppError('Odometer reading cannot decrease', 400);
    }

    Object.assign(vehicle, data);
    return vehicle.save();
  }

  static async updateStatus(id: string, status: VehicleStatus) {
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    vehicle.status = status;
    return vehicle.save();
  }

  static async getHistory(id: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const vehicle = await Vehicle.findById(id);
    if (!vehicle) throw new NotFoundError('Vehicle not found');

    const total = await FuelTransaction.countDocuments({ vehicleId: id });
    const transactions = await FuelTransaction.find({ vehicleId: id })
      .populate('driverId', 'fullName')
      .sort({ fuelDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getActiveVehicles() {
    return Vehicle.find({ status: VehicleStatus.ACTIVE }).select('vehicleName plateNumber');
  }
}
