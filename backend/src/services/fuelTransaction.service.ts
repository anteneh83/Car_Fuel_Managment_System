import mongoose from 'mongoose';
import { FuelTransaction } from '../models/FuelTransaction';
import { FuelRequest } from '../models/FuelRequest';
import { Vehicle } from '../models/Vehicle';
import { Driver } from '../models/Driver';
import { CloudinaryService } from './cloudinary.service';
import { FuelValidationService } from './fuelValidation.service';
import { FraudDetectionService } from './fraudDetection.service';
import { AuditLogService } from './auditLog.service';
import {
  VehicleStatus,
  DriverStatus,
  FuelRequestStatus,
  ReviewStatus,
  AuditAction,
} from '../types';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors';

export class FuelTransactionService {
  /**
   * Phase 2 — Post-fueling completion submitted by Monitor.
   * Requires an APPROVED Phase 1 FuelRequest.
   */
  static async create(params: {
    fuelRequestId: string;
    monitorId: string;
    userId: string;
    userRole: string;
    fuelStationName: string;
    fuelType: string;
    fuelQuantity: number;
    pricePerLiter: number;
    odometerReading: number;
    receiptNumber: string;
    fuelDate: string;
    receiptFile?: Express.Multer.File;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // 1. Verify FuelRequest exists
    const fuelRequest = await FuelRequest.findById(params.fuelRequestId);
    if (!fuelRequest) {
      throw new NotFoundError('Fuel request not found');
    }

    // 2. Verify FuelRequest is APPROVED
    if (fuelRequest.status !== FuelRequestStatus.APPROVED) {
      throw new AppError(
        `Cannot complete transaction. Fuel request is ${fuelRequest.status} (must be APPROVED).`,
        400
      );
    }

    // Check if this request has already been completed
    const existingTransaction = await FuelTransaction.findOne({ fuelRequestId: fuelRequest._id });
    if (existingTransaction) {
      throw new AppError('A completed transaction already exists for this fuel request', 400);
    }

    // 3. Verify driver exists and is active
    const driver = await Driver.findById(fuelRequest.driverId);
    if (!driver) throw new NotFoundError('Driver associated with fuel request not found');
    if (driver.status !== DriverStatus.ACTIVE) {
      throw new ForbiddenError('Inactive drivers cannot have transactions processed');
    }

    // 4. Verify vehicle exists and is active
    const vehicle = await Vehicle.findById(fuelRequest.vehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle associated with fuel request not found');
    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new AppError('Vehicle is not active', 400);
    }

    // 5. Validate odometer
    if (params.odometerReading < vehicle.currentOdometer) {
      throw new AppError(
        `Odometer cannot be less than previous reading (${vehicle.currentOdometer} km)`,
        400
      );
    }

    if (params.fuelQuantity <= 0) throw new AppError('Fuel quantity must be positive', 400);
    if (params.pricePerLiter <= 0) throw new AppError('Price per liter must be positive', 400);

    let receiptImage = null;
    if (params.receiptFile) {
      receiptImage = await CloudinaryService.uploadReceipt(
        params.receiptFile.buffer,
        params.receiptFile.originalname,
        params.receiptFile.mimetype
      );
    }

    try {
      // Core calculations using actual fueling data
      const fuelCalc = FuelValidationService.calculate(
        params.odometerReading,
        vehicle.currentOdometer,
        params.fuelQuantity,
        vehicle.averageFuelConsumption
      );

      const totalAmount = Math.round(params.fuelQuantity * params.pricePerLiter * 100) / 100;

      // Run fraud detection engine
      const fraudResult = await FraudDetectionService.evaluate({
        vehicleId: vehicle._id.toString(),
        driverId: driver._id.toString(),
        fuelQuantity: params.fuelQuantity,
        variancePercentage: fuelCalc.variancePercentage,
        receiptNumber: params.receiptNumber,
        fuelDate: new Date(params.fuelDate),
        submittedAt: new Date(),
        fuelStationName: params.fuelStationName,
      });

      const txStatus = FuelValidationService.getTransactionStatus(fuelCalc.variancePercentage);

      // Create final transaction linked to fuelRequestId and monitorId
      const transaction = await FuelTransaction.create({
        fuelRequestId: fuelRequest._id,
        vehicleId: vehicle._id,
        driverId: driver._id,
        monitorId: new mongoose.Types.ObjectId(params.monitorId || params.userId),
        fuelStationName: params.fuelStationName,
        fuelType: params.fuelType,
        fuelQuantity: params.fuelQuantity,
        pricePerLiter: params.pricePerLiter,
        totalAmount,
        odometerReading: params.odometerReading,
        previousOdometer: vehicle.currentOdometer,
        ...fuelCalc,
        receiptNumber: params.receiptNumber,
        receiptImage,
        fuelDate: new Date(params.fuelDate),
        submittedAt: new Date(),
        status: txStatus,
        ...fraudResult,
        reviewStatus: ReviewStatus.PENDING,
      });

      // Update vehicle odometer
      vehicle.currentOdometer = params.odometerReading;
      await vehicle.save();

      // Audit log
      await AuditLogService.log({
        userId: params.userId,
        userRole: params.userRole,
        action: AuditAction.FUEL_TRANSACTION_CREATED,
        entityType: 'FuelTransaction',
        entityId: transaction._id as any,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });

      // Send alerts if high risk or critical
      await FraudDetectionService.sendFraudNotifications(
        fraudResult,
        vehicle.plateNumber,
        driver.fullName,
        (transaction._id as any).toString()
      );

      return transaction;
    } catch (error) {
      if (receiptImage) {
        await CloudinaryService.deleteReceipt(receiptImage.publicId, receiptImage.resourceType);
      }
      throw error;
    }
  }

  static async getAll(query: any) {
    const {
      page = 1,
      limit = 20,
      status,
      riskLevel,
      reviewStatus,
      vehicleId,
      driverId,
      monitorId,
      fuelType,
      startDate,
      endDate,
      search,
    } = query;

    const filter: any = {};
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (reviewStatus) filter.reviewStatus = reviewStatus;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (driverId) filter.driverId = driverId;
    if (monitorId) filter.monitorId = monitorId;
    if (fuelType) filter.fuelType = fuelType;
    if (startDate || endDate) {
      filter.fuelDate = {};
      if (startDate) filter.fuelDate.$gte = new Date(startDate);
      if (endDate) filter.fuelDate.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { fuelStationName: { $regex: search, $options: 'i' } },
        { receiptNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await FuelTransaction.countDocuments(filter);
    const transactions = await FuelTransaction.find(filter)
      .populate('vehicleId', 'vehicleName plateNumber')
      .populate('driverId', 'fullName phoneNumber licenseNumber')
      .populate('monitorId', 'username fullName')
      .populate('fuelRequestId')
      .sort({ fuelDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async getById(id: string) {
    const tx = await FuelTransaction.findById(id)
      .populate('vehicleId')
      .populate('driverId', 'fullName phoneNumber licenseNumber')
      .populate('monitorId', 'username fullName')
      .populate('fuelRequestId')
      .populate('reviewedBy', 'username fullName');

    if (!tx) throw new NotFoundError('Transaction not found');
    return tx;
  }

  static async getMyTransactions(monitorId: string, query: any) {
    const { page = 1, limit = 20 } = query;
    const total = await FuelTransaction.countDocuments({ monitorId });
    const transactions = await FuelTransaction.find({ monitorId })
      .populate('vehicleId', 'vehicleName plateNumber')
      .populate('driverId', 'fullName')
      .populate('fuelRequestId')
      .sort({ fuelDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  static async review(id: string, userId: string, notes?: string) {
    const tx = await FuelTransaction.findById(id);
    if (!tx) throw new NotFoundError('Transaction not found');
    tx.reviewStatus = ReviewStatus.REVIEWED;
    tx.reviewedBy = new mongoose.Types.ObjectId(userId);
    tx.reviewedAt = new Date();
    if (notes) tx.investigationNotes = notes;
    return tx.save();
  }

  static async investigate(id: string, userId: string, notes: string) {
    const tx = await FuelTransaction.findById(id);
    if (!tx) throw new NotFoundError('Transaction not found');
    tx.reviewStatus = ReviewStatus.INVESTIGATED;
    tx.reviewedBy = new mongoose.Types.ObjectId(userId);
    tx.reviewedAt = new Date();
    tx.investigationNotes = notes;
    return tx.save();
  }

  static async resolve(id: string, userId: string, notes: string) {
    const tx = await FuelTransaction.findById(id);
    if (!tx) throw new NotFoundError('Transaction not found');
    tx.reviewStatus = ReviewStatus.RESOLVED;
    tx.reviewedBy = new mongoose.Types.ObjectId(userId);
    tx.reviewedAt = new Date();
    tx.investigationNotes = notes;
    return tx.save();
  }

  static async getFraudAlerts(query: any) {
    const {
      page = 1,
      limit = 20,
      riskLevel,
      reviewStatus,
      vehicleId,
      driverId,
      startDate,
      endDate,
    } = query;

    const filter: any = { riskScore: { $gt: 0 } };
    if (riskLevel) filter.riskLevel = riskLevel;
    if (reviewStatus) filter.reviewStatus = reviewStatus;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (driverId) filter.driverId = driverId;
    if (startDate || endDate) {
      filter.fuelDate = {};
      if (startDate) filter.fuelDate.$gte = new Date(startDate);
      if (endDate) filter.fuelDate.$lte = new Date(endDate);
    }

    const total = await FuelTransaction.countDocuments(filter);
    const transactions = await FuelTransaction.find(filter)
      .populate('vehicleId', 'vehicleName plateNumber')
      .populate('driverId', 'fullName')
      .populate('monitorId', 'username fullName')
      .populate('fuelRequestId')
      .sort({ riskScore: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
