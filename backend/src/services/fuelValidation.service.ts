import { IVehicle } from '../models/Vehicle';
import { FuelCalculation } from '../types';

export class FuelValidationService {
  /**
   * Calculate fuel consumption metrics.
   */
  static calculate(
    currentOdometer: number,
    previousOdometer: number,
    claimedFuel: number,
    averageFuelConsumption: number
  ): FuelCalculation {
    const distanceTraveled = currentOdometer - previousOdometer;

    // Handle edge cases
    if (distanceTraveled <= 0 || averageFuelConsumption <= 0) {
      return {
        distanceTraveled: Math.max(0, distanceTraveled),
        expectedFuel: 0,
        fuelDifference: claimedFuel,
        variancePercentage: distanceTraveled === 0 && claimedFuel > 0 ? 100 : 0,
      };
    }

    const expectedFuel = distanceTraveled / averageFuelConsumption;

    // Avoid division by zero
    if (expectedFuel === 0) {
      return {
        distanceTraveled,
        expectedFuel: 0,
        fuelDifference: claimedFuel,
        variancePercentage: claimedFuel > 0 ? 100 : 0,
      };
    }

    const fuelDifference = claimedFuel - expectedFuel;
    const variancePercentage = (fuelDifference / expectedFuel) * 100;

    return {
      distanceTraveled: Math.round(distanceTraveled * 100) / 100,
      expectedFuel: Math.round(expectedFuel * 100) / 100,
      fuelDifference: Math.round(fuelDifference * 100) / 100,
      variancePercentage: Math.round(variancePercentage * 100) / 100,
    };
  }

  /**
   * Determine transaction status based on variance.
   */
  static getTransactionStatus(variancePercentage: number): string {
    if (variancePercentage < 15) return 'NORMAL';
    if (variancePercentage <= 30) return 'WARNING';
    return 'HIGH_RISK';
  }
}
