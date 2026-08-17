import { Driver, IDriver } from '../models/Driver';
import { Vehicle } from '../models/Vehicle';
import { FuelTransaction } from '../models/FuelTransaction';
import { DriverStatus, VehicleStatus } from '../types';
import { NotFoundError, AppError, ConflictError } from '../utils/errors';

export class DriverService {
  static async getAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = query;
    const filter: any = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Driver.countDocuments(filter);
    const drivers = await Driver.find(filter)
      .populate('assignedVehicleId', 'vehicleName plateNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: drivers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const driver = await Driver.findById(id).populate('assignedVehicleId');
    if (!driver) throw new NotFoundError('Driver not found');
    return driver;
  }

  static async create(data: {
    fullName: string;
    phoneNumber: string;
    licenseNumber: string;
    assignedVehicleId?: string;
    status?: DriverStatus;
  }) {
    // Check if licenseNumber already exists
    const existing = await Driver.findOne({ licenseNumber: data.licenseNumber.trim() });
    if (existing) {
      throw new ConflictError('A driver with this license number already exists');
    }

    // Validate vehicle exists and is active
    if (data.assignedVehicleId) {
      const vehicle = await Vehicle.findById(data.assignedVehicleId);
      if (!vehicle) throw new NotFoundError('Assigned vehicle not found');
      if (vehicle.status !== VehicleStatus.ACTIVE) {
        throw new AppError('Cannot assign an inactive or archived vehicle', 400);
      }
    }

    // Create driver as managed entity (no user login account)
    const driver = await Driver.create({
      fullName: data.fullName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      licenseNumber: data.licenseNumber.trim(),
      assignedVehicleId: data.assignedVehicleId || null,
      status: data.status || DriverStatus.ACTIVE,
    });

    return { driver };
  }

  static async update(id: string, data: Partial<IDriver>) {
    const driver = await Driver.findById(id);
    if (!driver) throw new NotFoundError('Driver not found');

    if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
      const existing = await Driver.findOne({ licenseNumber: data.licenseNumber.trim(), _id: { $ne: id } });
      if (existing) {
        throw new ConflictError('A driver with this license number already exists');
      }
    }

    if (data.assignedVehicleId) {
      const vehicle = await Vehicle.findById(data.assignedVehicleId);
      if (!vehicle) throw new NotFoundError('Assigned vehicle not found');
      if (vehicle.status !== VehicleStatus.ACTIVE) {
        throw new AppError('Cannot assign an inactive or archived vehicle', 400);
      }
    }

    Object.assign(driver, data);
    return driver.save();
  }

  static async updateStatus(id: string, status: DriverStatus) {
    const driver = await Driver.findById(id);
    if (!driver) throw new NotFoundError('Driver not found');

    driver.status = status;
    return driver.save();
  }

  static async getTransactions(driverId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const total = await FuelTransaction.countDocuments({ driverId });
    const transactions = await FuelTransaction.find({ driverId })
      .populate('vehicleId', 'vehicleName plateNumber')
      .populate('monitorId', 'username fullName')
      .sort({ fuelDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
