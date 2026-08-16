import bcrypt from 'bcryptjs';
import { Driver, IDriver } from '../models/Driver';
import { User } from '../models/User';
import { Vehicle } from '../models/Vehicle';
import { FuelTransaction } from '../models/FuelTransaction';
import { DriverStatus, UserRole, VehicleStatus } from '../types';
import { NotFoundError, AppError, ConflictError } from '../utils/errors';
import { generateUsername, generateTempPassword } from '../utils/credentials';

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
      .populate('userId', 'username isActive lastLoginAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: drivers,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const driver = await Driver.findById(id)
      .populate('assignedVehicleId')
      .populate('userId', 'username isActive lastLoginAt mustChangePassword');
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
    // Validate vehicle exists and is active
    if (data.assignedVehicleId) {
      const vehicle = await Vehicle.findById(data.assignedVehicleId);
      if (!vehicle) throw new NotFoundError('Assigned vehicle not found');
      if (vehicle.status !== VehicleStatus.ACTIVE) {
        throw new AppError('Cannot assign an inactive or archived vehicle', 400);
      }
    }

    // Generate credentials
    const existingUsernames = (await User.find().select('username')).map(u => u.username);
    const username = generateUsername(data.fullName, existingUsernames);
    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    // Create user
    const user = await User.create({
      username,
      passwordHash,
      role: UserRole.DRIVER,
      isActive: true,
      mustChangePassword: true,
    });

    try {
      // Create driver
      const driver = await Driver.create({
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        licenseNumber: data.licenseNumber,
        assignedVehicleId: data.assignedVehicleId || null,
        status: data.status || DriverStatus.ACTIVE,
        userId: user._id,
      });

      // Link driver to user
      user.driverId = driver._id as any;
      await user.save();

      return {
        driver,
        credentials: {
          username,
          tempPassword, // Returned only once
        },
      };
    } catch (error) {
      // Rollback user creation if driver creation fails
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  }

  static async update(id: string, data: Partial<IDriver>) {
    const driver = await Driver.findById(id);
    if (!driver) throw new NotFoundError('Driver not found');

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
    await driver.save();

    // Also update user isActive status
    if (status === DriverStatus.INACTIVE || status === DriverStatus.SUSPENDED) {
      await User.findByIdAndUpdate(driver.userId, { isActive: false });
    } else if (status === DriverStatus.ACTIVE) {
      await User.findByIdAndUpdate(driver.userId, { isActive: true });
    }

    return driver;
  }

  static async getTransactions(driverId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const total = await FuelTransaction.countDocuments({ driverId });
    const transactions = await FuelTransaction.find({ driverId })
      .populate('vehicleId', 'vehicleName plateNumber')
      .sort({ fuelDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
