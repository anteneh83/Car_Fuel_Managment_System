import mongoose from 'mongoose';
import { FuelRequest } from '../models/FuelRequest';
import { Vehicle } from '../models/Vehicle';
import { Driver } from '../models/Driver';
import { CloudinaryService } from './cloudinary.service';
import { FuelValidationService } from './fuelValidation.service';
import { AuditLogService } from './auditLog.service';
import { NotificationService } from './notification.service';
import {
  VehicleStatus, DriverStatus, FuelRequestStatus,
  AuditAction, NotificationType,
} from '../types';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors';

export class FuelRequestService {
  /**
   * Phase 1 — Monitor creates a pre-fueling request.
   */
  static async create(params: {
    monitorId: string;
    driverId: string;
    vehicleId: string;
    fuelType: string;
    fuelQuantity: number;
    pricePerLiter: number;
    odometerReading: number;
    odometerFile: Express.Multer.File;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Validate driver exists and is active
    const driver = await Driver.findById(params.driverId);
    if (!driver) throw new NotFoundError('Driver not found');
    if (driver.status !== DriverStatus.ACTIVE) throw new ForbiddenError('Inactive drivers cannot be assigned fuel requests');

    // Validate vehicle exists and is active
    const vehicle = await Vehicle.findById(params.vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (vehicle.status !== VehicleStatus.ACTIVE) throw new AppError('Vehicle is not active', 400);

    // Validate odometer
    if (params.odometerReading < vehicle.currentOdometer) {
      throw new AppError(`Odometer cannot be less than previous reading (${vehicle.currentOdometer} km)`, 400);
    }

    // Validate inputs
    if (params.fuelQuantity <= 0) throw new AppError('Fuel quantity must be positive', 400);
    if (params.pricePerLiter <= 0) throw new AppError('Price per liter must be positive', 400);

    // Odometer image is mandatory
    if (!params.odometerFile) {
      throw new AppError('Odometer image is mandatory', 400);
    }

    // Upload odometer image to Cloudinary
    const odometerImage = await CloudinaryService.uploadReceipt(
      params.odometerFile.buffer,
      params.odometerFile.originalname,
      params.odometerFile.mimetype
    );

    try {
      // Calculate preliminary values for Admin review
      const estimatedTotalAmount = Math.round(params.fuelQuantity * params.pricePerLiter * 100) / 100;
      const distanceSincePrevious = params.odometerReading - vehicle.currentOdometer;

      let estimatedExpectedFuel = 0;
      let estimatedVariance = 0;

      if (distanceSincePrevious > 0 && vehicle.averageFuelConsumption > 0) {
        estimatedExpectedFuel = Math.round((distanceSincePrevious / vehicle.averageFuelConsumption) * 100) / 100;
        if (estimatedExpectedFuel > 0) {
          estimatedVariance = Math.round(((params.fuelQuantity - estimatedExpectedFuel) / estimatedExpectedFuel) * 100 * 100) / 100;
        }
      } else if (distanceSincePrevious === 0 && params.fuelQuantity > 0) {
        estimatedVariance = 100;
      }

      const request = await FuelRequest.create({
        driverId: params.driverId,
        vehicleId: params.vehicleId,
        monitorId: params.monitorId,
        fuelType: params.fuelType,
        fuelQuantity: params.fuelQuantity,
        pricePerLiter: params.pricePerLiter,
        odometerReading: params.odometerReading,
        odometerImage,
        status: FuelRequestStatus.PENDING,
        estimatedTotalAmount,
        distanceSincePrevious,
        estimatedExpectedFuel,
        estimatedVariance,
        previousOdometer: vehicle.currentOdometer,
      });

      // Notify Admin about new fuel request
      await NotificationService.notifyOwner({
        type: NotificationType.FUEL_REQUEST_SUBMITTED,
        title: 'New Fuel Request',
        message: `New fuel request submitted by monitor for driver ${driver.fullName}, vehicle ${vehicle.plateNumber}. Quantity: ${params.fuelQuantity}L.`,
        relatedTransactionId: (request._id as any).toString(),
      });

      return request;
    } catch (error) {
      // Rollback image upload on failure
      if (odometerImage) {
        await CloudinaryService.deleteReceipt(odometerImage.publicId, odometerImage.resourceType);
      }
      throw error;
    }
  }

  /**
   * Get all fuel requests (Admin view).
   */
  static async getAll(query: any) {
    const { page = 1, limit = 20, status, vehicleId, driverId, monitorId, startDate, endDate, search } = query;
    const filter: any = {};

    if (status) filter.status = status;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (driverId) filter.driverId = driverId;
    if (monitorId) filter.monitorId = monitorId;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { 'driverId': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await FuelRequest.countDocuments(filter);
    const requests = await FuelRequest.find(filter)
      .populate('vehicleId', 'vehicleName plateNumber brand model averageFuelConsumption')
      .populate('driverId', 'fullName phoneNumber licenseNumber')
      .populate('monitorId', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('rejectedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single fuel request by ID with full details.
   */
  static async getById(id: string) {
    const request = await FuelRequest.findById(id)
      .populate('vehicleId')
      .populate('driverId', 'fullName phoneNumber licenseNumber')
      .populate('monitorId', 'username fullName')
      .populate('approvedBy', 'username fullName')
      .populate('rejectedBy', 'username fullName');

    if (!request) throw new NotFoundError('Fuel request not found');
    return request;
  }

  /**
   * Admin approves a fuel request.
   */
  static async approve(id: string, adminUserId: string) {
    const request = await FuelRequest.findById(id);
    if (!request) throw new NotFoundError('Fuel request not found');

    if (request.status !== FuelRequestStatus.PENDING) {
      throw new AppError(`Cannot approve a request that is already ${request.status}`, 400);
    }

    request.status = FuelRequestStatus.APPROVED;
    request.approvedBy = new mongoose.Types.ObjectId(adminUserId);
    request.approvedAt = new Date();
    await request.save();

    return request;
  }

  /**
   * Admin rejects a fuel request.
   */
  static async reject(id: string, adminUserId: string, rejectionReason: string) {
    const request = await FuelRequest.findById(id);
    if (!request) throw new NotFoundError('Fuel request not found');

    if (request.status !== FuelRequestStatus.PENDING) {
      throw new AppError(`Cannot reject a request that is already ${request.status}`, 400);
    }

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new AppError('Rejection reason is required', 400);
    }

    request.status = FuelRequestStatus.REJECTED;
    request.rejectedBy = new mongoose.Types.ObjectId(adminUserId);
    request.rejectedAt = new Date();
    request.rejectionReason = rejectionReason.trim();
    await request.save();

    return request;
  }

  /**
   * Monitor views their own fuel requests.
   */
  static async getMyRequests(monitorId: string, query: any) {
    const { page = 1, limit = 20, status } = query;
    const filter: any = { monitorId };
    if (status) filter.status = status;

    const total = await FuelRequest.countDocuments(filter);
    const requests = await FuelRequest.find(filter)
      .populate('vehicleId', 'vehicleName plateNumber')
      .populate('driverId', 'fullName')
      .populate('approvedBy', 'username fullName')
      .populate('rejectedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: requests,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
