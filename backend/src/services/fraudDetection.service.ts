import { FuelTransaction } from '../models/FuelTransaction';
import { FraudRule } from '../models/FraudRule';
import { FraudResult, RiskLevel, NotificationType } from '../types';
import { config } from '../config';
import { NotificationService } from './notification.service';
import { startOfDay, endOfDay, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export class FraudDetectionService {
  /**
   * Evaluate all active fraud rules against a transaction.
   * Returns risk score, level, and triggered reasons.
   */
  static async evaluate(params: {
    vehicleId: string;
    driverId: string;
    fuelQuantity: number;
    variancePercentage: number;
    receiptNumber: string;
    fuelDate: Date;
    submittedAt: Date;
    fuelStationName: string;
    transactionId?: string;
  }): Promise<FraudResult> {
    let riskScore = 0;
    const fraudReasons: string[] = [];

    // Load active fraud rules
    const rules = await FraudRule.find({ isActive: true });
    const ruleMap = new Map(rules.map(r => [r.code, r]));

    // RULE 1 — EXPECTED FUEL EXCEEDED (>20%)
    const rule1 = ruleMap.get('EXPECTED_FUEL_EXCEEDED');
    if (rule1 && params.variancePercentage > (rule1.threshold || 20)) {
      riskScore += rule1.score;
      fraudReasons.push(`Fuel exceeds expected consumption by more than ${rule1.threshold || 20}%.`);
    }

    // RULE 2 — SEVERE FUEL VARIANCE (>40%)
    const rule2 = ruleMap.get('SEVERE_FUEL_VARIANCE');
    if (rule2 && params.variancePercentage > (rule2.threshold || 40)) {
      riskScore += rule2.score;
      fraudReasons.push(`Fuel exceeds expected consumption by more than ${rule2.threshold || 40}%.`);
    }

    // RULE 3 — MULTIPLE FUELING SAME DAY
    const rule3 = ruleMap.get('MULTIPLE_FUELING_SAME_DAY');
    if (rule3) {
      const sameDayCount = await FuelTransaction.countDocuments({
        vehicleId: params.vehicleId,
        fuelDate: {
          $gte: startOfDay(params.fuelDate),
          $lte: endOfDay(params.fuelDate),
        },
        ...(params.transactionId ? { _id: { $ne: params.transactionId } } : {}),
      });
      if (sameDayCount > 0) {
        riskScore += rule3.score;
        fraudReasons.push('Vehicle was fueled more than once on the same day.');
      }
    }

    // RULE 4 — MONTHLY CONSUMPTION ABOVE HISTORICAL AVERAGE
    const rule4 = ruleMap.get('MONTHLY_ABOVE_AVERAGE');
    if (rule4) {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);

      // Current month total
      const currentMonthResult = await FuelTransaction.aggregate([
        {
          $match: {
            vehicleId: params.vehicleId,
            fuelDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
          },
        },
        { $group: { _id: null, total: { $sum: '$fuelQuantity' } } },
      ]);
      const currentMonthTotal = (currentMonthResult[0]?.total || 0) + params.fuelQuantity;

      // Historical average (last 6 months)
      const sixMonthsAgo = subMonths(now, 6);
      const historicalResult = await FuelTransaction.aggregate([
        {
          $match: {
            vehicleId: params.vehicleId,
            fuelDate: { $gte: sixMonthsAgo, $lt: currentMonthStart },
          },
        },
        {
          $group: {
            _id: { $month: '$fuelDate' },
            total: { $sum: '$fuelQuantity' },
          },
        },
      ]);

      if (historicalResult.length > 0) {
        const avgMonthly = historicalResult.reduce((sum: number, r: any) => sum + r.total, 0) / historicalResult.length;
        if (avgMonthly > 0 && ((currentMonthTotal - avgMonthly) / avgMonthly) * 100 > (rule4.threshold || 30)) {
          riskScore += rule4.score;
          fraudReasons.push('Monthly fuel consumption exceeds historical average by more than 30%.');
        }
      }
    }

    // RULE 5 — DUPLICATE RECEIPT
    const rule5 = ruleMap.get('DUPLICATE_RECEIPT');
    if (rule5) {
      const duplicateCount = await FuelTransaction.countDocuments({
        receiptNumber: params.receiptNumber,
        ...(params.transactionId ? { _id: { $ne: params.transactionId } } : {}),
      });
      if (duplicateCount > 0) {
        riskScore += rule5.score;
        fraudReasons.push('Duplicate receipt number detected.');
      }
    }

    // RULE 6 — LATE RECEIPT
    const rule6 = ruleMap.get('LATE_RECEIPT');
    if (rule6) {
      const daysDiff = Math.floor(
        (params.submittedAt.getTime() - params.fuelDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff > (rule6.threshold || 3)) {
        riskScore += rule6.score;
        fraudReasons.push('Receipt was submitted more than three days after fueling.');
      }
    }

    // RULE 7 — OUTSIDE WORKING HOURS
    const rule7 = ruleMap.get('OUTSIDE_WORKING_HOURS');
    if (rule7) {
      const fuelHour = params.fuelDate.getHours();
      if (fuelHour < config.workingHours.start || fuelHour >= config.workingHours.end) {
        riskScore += rule7.score;
        fraudReasons.push('Fuel transaction occurred outside approved working hours.');
      }
    }

    // RULE 8 — REPEATED FUEL STATION
    const rule8 = ruleMap.get('REPEATED_FUEL_STATION');
    if (rule8) {
      const threeMonthsAgo = subMonths(new Date(), 3);
      const stationUsage = await FuelTransaction.aggregate([
        {
          $match: {
            driverId: params.driverId,
            fuelDate: { $gte: threeMonthsAgo },
          },
        },
        {
          $group: {
            _id: '$fuelStationName',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      if (stationUsage.length > 1) {
        const topStation = stationUsage[0];
        const totalTx = stationUsage.reduce((sum: number, s: any) => sum + s.count, 0);
        // If one station is used > 70% of the time
        if (topStation._id === params.fuelStationName && topStation.count / totalTx > 0.7) {
          riskScore += rule8.score;
          fraudReasons.push('Repeated fuel station usage detected.');
        }
      }
    }

    // RULE 9 — REPEATED ROUNDED QUANTITIES
    const rule9 = ruleMap.get('REPEATED_ROUNDED_QUANTITIES');
    if (rule9) {
      const recentTx = await FuelTransaction.find({
        driverId: params.driverId,
      })
        .sort({ fuelDate: -1 })
        .limit(5)
        .select('fuelQuantity');

      const allQuantities = [...recentTx.map(t => t.fuelQuantity), params.fuelQuantity];
      const roundedCount = allQuantities.filter(q => q % 5 === 0).length;
      // If 4+ out of recent transactions are perfectly rounded to 5
      if (roundedCount >= 4 && allQuantities.length >= 4) {
        riskScore += rule9.score;
        fraudReasons.push('Repeated rounded fuel quantities detected.');
      }
    }

    // Calculate risk level
    const riskLevel = this.getRiskLevel(riskScore);

    return { riskScore, riskLevel, fraudReasons };
  }

  static getRiskLevel(score: number): RiskLevel {
    if (score <= 30) return RiskLevel.LOW;
    if (score <= 60) return RiskLevel.MEDIUM;
    if (score <= 100) return RiskLevel.HIGH;
    return RiskLevel.CRITICAL;
  }

  /**
   * Send notifications based on fraud result.
   */
  static async sendFraudNotifications(
    fraudResult: FraudResult,
    vehiclePlate: string,
    driverName: string,
    transactionId: string
  ): Promise<void> {
    if (fraudResult.riskLevel === RiskLevel.HIGH) {
      await NotificationService.notifyOwner({
        type: NotificationType.HIGH_RISK_TRANSACTION,
        title: 'High-Risk Transaction Detected',
        message: `High-risk fuel transaction detected for vehicle ${vehiclePlate} by driver ${driverName}. Risk score: ${fraudResult.riskScore}.`,
        relatedTransactionId: transactionId,
      });
    }

    if (fraudResult.riskLevel === RiskLevel.CRITICAL) {
      await NotificationService.notifyOwner({
        type: NotificationType.CRITICAL_FRAUD,
        title: 'Critical Fraud Alert',
        message: `CRITICAL fraud alert for vehicle ${vehiclePlate} by driver ${driverName}. Risk score: ${fraudResult.riskScore}. Immediate investigation required.`,
        relatedTransactionId: transactionId,
      });
    }

    if (fraudResult.fraudReasons.includes('Duplicate receipt number detected.')) {
      await NotificationService.notifyOwner({
        type: NotificationType.DUPLICATE_RECEIPT,
        title: 'Duplicate Receipt Detected',
        message: `A duplicate receipt number was detected for vehicle ${vehiclePlate} by driver ${driverName}.`,
        relatedTransactionId: transactionId,
      });
    }
  }
}
