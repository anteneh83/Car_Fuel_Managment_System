import { FuelTransaction } from '../models/FuelTransaction';
import { Vehicle } from '../models/Vehicle';
import { Driver } from '../models/Driver';
import { VehicleStatus, DriverStatus, RiskLevel } from '../types';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';

export class DashboardService {
  static async getSummary(query: { startDate?: string; endDate?: string }) {
    const dateFilter: any = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate);
    if (query.endDate) dateFilter.$lte = new Date(query.endDate);
    const txFilter: any = Object.keys(dateFilter).length > 0 ? { fuelDate: dateFilter } : {};

    const [fuelStats, activeVehicles, activeDrivers, highRisk, critical] = await Promise.all([
      FuelTransaction.aggregate([
        { $match: txFilter },
        { $group: { _id: null, totalCost: { $sum: '$totalAmount' }, totalLiters: { $sum: '$fuelQuantity' }, totalTx: { $sum: 1 }, avgConsumption: { $avg: '$variancePercentage' } } },
      ]),
      Vehicle.countDocuments({ status: VehicleStatus.ACTIVE }),
      Driver.countDocuments({ status: DriverStatus.ACTIVE }),
      FuelTransaction.countDocuments({ ...txFilter, riskLevel: { $in: [RiskLevel.HIGH] } }),
      FuelTransaction.countDocuments({ ...txFilter, riskLevel: RiskLevel.CRITICAL }),
    ]);

    const stats = fuelStats[0] || { totalCost: 0, totalLiters: 0, totalTx: 0, avgConsumption: 0 };
    return {
      totalFuelCost: Math.round(stats.totalCost * 100) / 100,
      totalLiters: Math.round(stats.totalLiters * 100) / 100,
      totalTransactions: stats.totalTx,
      activeVehicles, activeDrivers,
      highRiskTransactions: highRisk, criticalTransactions: critical,
      averageFuelConsumption: Math.round(stats.avgConsumption * 100) / 100,
    };
  }

  static async getFuelCost(query: { startDate?: string; endDate?: string }) {
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : subMonths(now, 11);
    const end = query.endDate ? new Date(query.endDate) : now;

    return FuelTransaction.aggregate([
      { $match: { fuelDate: { $gte: start, $lte: end } } },
      { $group: { _id: { year: { $year: '$fuelDate' }, month: { $month: '$fuelDate' } }, totalCost: { $sum: '$totalAmount' }, totalLiters: { $sum: '$fuelQuantity' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  static async getVehicleUsage(query: { startDate?: string; endDate?: string }) {
    const filter: any = {};
    if (query.startDate || query.endDate) { filter.fuelDate = {}; if (query.startDate) filter.fuelDate.$gte = new Date(query.startDate); if (query.endDate) filter.fuelDate.$lte = new Date(query.endDate); }

    return FuelTransaction.aggregate([
      { $match: filter },
      { $lookup: { from: 'vehicles', localField: 'vehicleId', foreignField: '_id', as: 'vehicle' } },
      { $unwind: '$vehicle' },
      { $group: { _id: '$vehicleId', vehicleName: { $first: '$vehicle.vehicleName' }, plateNumber: { $first: '$vehicle.plateNumber' }, totalLiters: { $sum: '$fuelQuantity' }, totalCost: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { totalCost: -1 } },
    ]);
  }

  static async getDriverUsage(query: { startDate?: string; endDate?: string }) {
    const filter: any = {};
    if (query.startDate || query.endDate) { filter.fuelDate = {}; if (query.startDate) filter.fuelDate.$gte = new Date(query.startDate); if (query.endDate) filter.fuelDate.$lte = new Date(query.endDate); }

    return FuelTransaction.aggregate([
      { $match: filter },
      { $lookup: { from: 'drivers', localField: 'driverId', foreignField: '_id', as: 'driver' } },
      { $unwind: '$driver' },
      { $group: { _id: '$driverId', driverName: { $first: '$driver.fullName' }, totalLiters: { $sum: '$fuelQuantity' }, totalCost: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { totalCost: -1 } },
    ]);
  }

  static async getStationUsage(query: { startDate?: string; endDate?: string }) {
    const filter: any = {};
    if (query.startDate || query.endDate) { filter.fuelDate = {}; if (query.startDate) filter.fuelDate.$gte = new Date(query.startDate); if (query.endDate) filter.fuelDate.$lte = new Date(query.endDate); }

    return FuelTransaction.aggregate([
      { $match: filter },
      { $group: { _id: '$fuelStationName', totalLiters: { $sum: '$fuelQuantity' }, totalCost: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  }

  static async getRiskDistribution(query: { startDate?: string; endDate?: string }) {
    const filter: any = {};
    if (query.startDate || query.endDate) { filter.fuelDate = {}; if (query.startDate) filter.fuelDate.$gte = new Date(query.startDate); if (query.endDate) filter.fuelDate.$lte = new Date(query.endDate); }

    return FuelTransaction.aggregate([
      { $match: filter },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
    ]);
  }

  static async getConsumptionTrend(query: { startDate?: string; endDate?: string }) {
    const now = new Date();
    const start = query.startDate ? new Date(query.startDate) : subMonths(now, 11);
    const end = query.endDate ? new Date(query.endDate) : now;

    return FuelTransaction.aggregate([
      { $match: { fuelDate: { $gte: start, $lte: end } } },
      { $group: { _id: { year: { $year: '$fuelDate' }, month: { $month: '$fuelDate' } }, expectedFuel: { $sum: '$expectedFuel' }, claimedFuel: { $sum: '$fuelQuantity' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
  }

  // Driver dashboard
  static async getDriverSummary(driverId: string) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [total, monthlyStats, warnings, highRisk] = await Promise.all([
      FuelTransaction.countDocuments({ driverId }),
      FuelTransaction.aggregate([
        { $match: { driverId: driverId as any, fuelDate: { $gte: monthStart, $lte: monthEnd } } },
        { $group: { _id: null, totalLiters: { $sum: '$fuelQuantity' }, totalCost: { $sum: '$totalAmount' }, avgVariance: { $avg: '$variancePercentage' } } },
      ]),
      FuelTransaction.countDocuments({ driverId, riskLevel: { $in: [RiskLevel.MEDIUM, RiskLevel.HIGH] } }),
      FuelTransaction.countDocuments({ driverId, riskLevel: { $in: [RiskLevel.HIGH, RiskLevel.CRITICAL] } }),
    ]);

    const monthly = monthlyStats[0] || { totalLiters: 0, totalCost: 0, avgVariance: 0 };
    return {
      totalTransactions: total,
      thisMonthFuel: Math.round(monthly.totalLiters * 100) / 100,
      thisMonthCost: Math.round(monthly.totalCost * 100) / 100,
      averageFuelUsage: Math.round(monthly.avgVariance * 100) / 100,
      warningTransactions: warnings,
      highRiskTransactions: highRisk,
    };
  }
}
