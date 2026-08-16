import mongoose from 'mongoose';
import { FuelTransaction } from '../models/FuelTransaction';
import { Vehicle } from '../models/Vehicle';
import { Driver } from '../models/Driver';
import { CloudinaryService } from './cloudinary.service';
import { FuelValidationService } from './fuelValidation.service';
import { FraudDetectionService } from './fraudDetection.service';
import { AuditLogService } from './auditLog.service';
import { VehicleStatus, DriverStatus, ReviewStatus, AuditAction, NotificationType } from '../types';
import { AppError, NotFoundError, ForbiddenError } from '../utils/errors';

export class FuelTransactionService {
  static async create(params: {
    driverId: string; userId: string; userRole: string;
    fuelStationName: string; fuelType: string; fuelQuantity: number;
    pricePerLiter: number; odometerReading: number; receiptNumber: string;
    fuelDate: string; receiptFile?: Express.Multer.File;
    ipAddress?: string; userAgent?: string;
  }) {
    const driver = await Driver.findById(params.driverId);
    if (!driver) throw new NotFoundError('Driver not found');
    if (driver.status !== DriverStatus.ACTIVE) throw new ForbiddenError('Inactive drivers cannot submit');

    if (!driver.assignedVehicleId) throw new AppError('No vehicle assigned', 400);
    const vehicle = await Vehicle.findById(driver.assignedVehicleId);
    if (!vehicle) throw new NotFoundError('Vehicle not found');
    if (vehicle.status !== VehicleStatus.ACTIVE) throw new AppError('Vehicle not active', 400);

    if (params.odometerReading < vehicle.currentOdometer)
      throw new AppError(`Odometer cannot be less than previous reading (${vehicle.currentOdometer} km)`, 400);
    if (params.fuelQuantity <= 0) throw new AppError('Fuel quantity must be positive', 400);
    if (params.pricePerLiter <= 0) throw new AppError('Price per liter must be positive', 400);

    let receiptImage = null;
    if (params.receiptFile) {
      receiptImage = await CloudinaryService.uploadReceipt(
        params.receiptFile.buffer, params.receiptFile.originalname, params.receiptFile.mimetype
      );
    }

    try {
      const fuelCalc = FuelValidationService.calculate(
        params.odometerReading, vehicle.currentOdometer, params.fuelQuantity, vehicle.averageFuelConsumption
      );
      const totalAmount = Math.round(params.fuelQuantity * params.pricePerLiter * 100) / 100;
      const fraudResult = await FraudDetectionService.evaluate({
        vehicleId: vehicle._id.toString(), driverId: params.driverId,
        fuelQuantity: params.fuelQuantity, variancePercentage: fuelCalc.variancePercentage,
        receiptNumber: params.receiptNumber, fuelDate: new Date(params.fuelDate),
        submittedAt: new Date(), fuelStationName: params.fuelStationName,
      });
      const txStatus = FuelValidationService.getTransactionStatus(fuelCalc.variancePercentage);

      const transaction = await FuelTransaction.create({
        vehicleId: vehicle._id, driverId: driver._id,
        fuelStationName: params.fuelStationName, fuelType: params.fuelType,
        fuelQuantity: params.fuelQuantity, pricePerLiter: params.pricePerLiter, totalAmount,
        odometerReading: params.odometerReading, previousOdometer: vehicle.currentOdometer,
        ...fuelCalc, receiptNumber: params.receiptNumber, receiptImage,
        fuelDate: new Date(params.fuelDate), submittedAt: new Date(),
        status: txStatus, ...fraudResult, reviewStatus: ReviewStatus.PENDING,
      });

      vehicle.currentOdometer = params.odometerReading;
      await vehicle.save();

      await AuditLogService.log({
        userId: params.userId, userRole: params.userRole,
        action: AuditAction.FUEL_TRANSACTION_CREATED, entityType: 'FuelTransaction',
        entityId: transaction._id as any, ipAddress: params.ipAddress, userAgent: params.userAgent,
      });

      await FraudDetectionService.sendFraudNotifications(
        fraudResult, vehicle.plateNumber, driver.fullName, (transaction._id as any).toString()
      );
      return transaction;
    } catch (error) {
      if (receiptImage) await CloudinaryService.deleteReceipt(receiptImage.publicId, receiptImage.resourceType);
      throw error;
    }
  }

  static async getAll(query: any) {
    const { page = 1, limit = 20, status, riskLevel, reviewStatus, vehicleId, driverId, fuelType, startDate, endDate, search } = query;
    const filter: any = {};
    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (reviewStatus) filter.reviewStatus = reviewStatus;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (driverId) filter.driverId = driverId;
    if (fuelType) filter.fuelType = fuelType;
    if (startDate || endDate) { filter.fuelDate = {}; if (startDate) filter.fuelDate.$gte = new Date(startDate); if (endDate) filter.fuelDate.$lte = new Date(endDate); }
    if (search) { filter.$or = [{ fuelStationName: { $regex: search, $options: 'i' } }, { receiptNumber: { $regex: search, $options: 'i' } }]; }

    const total = await FuelTransaction.countDocuments(filter);
    const transactions = await FuelTransaction.find(filter)
      .populate('vehicleId', 'vehicleName plateNumber').populate('driverId', 'fullName')
      .sort({ fuelDate: -1 }).skip((page - 1) * limit).limit(limit);
    return { data: transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getById(id: string) {
    const tx = await FuelTransaction.findById(id).populate('vehicleId').populate('driverId', 'fullName phoneNumber licenseNumber').populate('reviewedBy', 'username');
    if (!tx) throw new NotFoundError('Transaction not found');
    return tx;
  }

  static async getMyTransactions(driverId: string, query: any) {
    const { page = 1, limit = 20 } = query;
    const total = await FuelTransaction.countDocuments({ driverId });
    const transactions = await FuelTransaction.find({ driverId }).populate('vehicleId', 'vehicleName plateNumber').sort({ fuelDate: -1 }).skip((page - 1) * limit).limit(limit);
    return { data: transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
    const { page = 1, limit = 20, riskLevel, reviewStatus, vehicleId, driverId, startDate, endDate } = query;
    const filter: any = { riskScore: { $gt: 0 } };
    if (riskLevel) filter.riskLevel = riskLevel;
    if (reviewStatus) filter.reviewStatus = reviewStatus;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (driverId) filter.driverId = driverId;
    if (startDate || endDate) { filter.fuelDate = {}; if (startDate) filter.fuelDate.$gte = new Date(startDate); if (endDate) filter.fuelDate.$lte = new Date(endDate); }

    const total = await FuelTransaction.countDocuments(filter);
    const transactions = await FuelTransaction.find(filter).populate('vehicleId', 'vehicleName plateNumber').populate('driverId', 'fullName').sort({ riskScore: -1 }).skip((page - 1) * limit).limit(limit);
    return { data: transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
