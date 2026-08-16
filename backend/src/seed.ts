import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { config } from './config';
import { connectDB } from './config/database';
import { User } from './models/User';
import { Driver } from './models/Driver';
import { Vehicle } from './models/Vehicle';
import { FuelTransaction } from './models/FuelTransaction';
import { FraudRule } from './models/FraudRule';
import { Notification } from './models/Notification';
import { AuditLog } from './models/AuditLog';
import { UserRole, DriverStatus, VehicleStatus, FuelType, RiskLevel, ReviewStatus, TransactionStatus } from './types';

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}), Driver.deleteMany({}), Vehicle.deleteMany({}),
    FuelTransaction.deleteMany({}), FraudRule.deleteMany({}),
    Notification.deleteMany({}), AuditLog.deleteMany({}),
  ]);

  // 1. Create Owner
  const ownerHash = await bcrypt.hash(config.owner.password, 12);
  const owner = await User.create({
    username: config.owner.username, passwordHash: ownerHash,
    role: UserRole.OWNER, isActive: true, mustChangePassword: false,
  });
  console.log(`✅ Owner: ${config.owner.username} / ${config.owner.password}`);

  // 2. Create Fraud Rules
  const fraudRules = [
    { name: 'Expected Fuel Exceeded', description: 'Fuel exceeds expected consumption by >20%', code: 'EXPECTED_FUEL_EXCEEDED', score: 30, threshold: 20 },
    { name: 'Severe Fuel Variance', description: 'Fuel exceeds expected consumption by >40%', code: 'SEVERE_FUEL_VARIANCE', score: 50, threshold: 40 },
    { name: 'Multiple Fueling Same Day', description: 'Vehicle fueled more than once on same day', code: 'MULTIPLE_FUELING_SAME_DAY', score: 20, threshold: 1 },
    { name: 'Monthly Above Average', description: 'Monthly consumption exceeds historical average by >30%', code: 'MONTHLY_ABOVE_AVERAGE', score: 20, threshold: 30 },
    { name: 'Duplicate Receipt', description: 'Same receipt number used twice', code: 'DUPLICATE_RECEIPT', score: 50, threshold: 0 },
    { name: 'Late Receipt', description: 'Receipt submitted >3 days after fueling', code: 'LATE_RECEIPT', score: 10, threshold: 3 },
    { name: 'Outside Working Hours', description: 'Transaction outside 08:00-18:00', code: 'OUTSIDE_WORKING_HOURS', score: 10, threshold: 0 },
    { name: 'Repeated Fuel Station', description: 'Driver uses same station >70% of the time', code: 'REPEATED_FUEL_STATION', score: 10, threshold: 70 },
    { name: 'Repeated Rounded Quantities', description: 'Multiple rounded fuel quantities', code: 'REPEATED_ROUNDED_QUANTITIES', score: 10, threshold: 4 },
  ];
  await FraudRule.insertMany(fraudRules);
  console.log('✅ Fraud rules created');

  // 3. Create Vehicles
  const vehicles = await Vehicle.insertMany([
    { plateNumber: 'AA-12345', vehicleName: 'Toyota Hilux', brand: 'Toyota', model: 'Hilux', manufacturingYear: 2022, fuelType: FuelType.DIESEL, tankCapacity: 80, averageFuelConsumption: 10, currentOdometer: 45000, status: VehicleStatus.ACTIVE },
    { plateNumber: 'AA-54321', vehicleName: 'Toyota Land Cruiser', brand: 'Toyota', model: 'Land Cruiser', manufacturingYear: 2021, fuelType: FuelType.DIESEL, tankCapacity: 93, averageFuelConsumption: 8, currentOdometer: 62000, status: VehicleStatus.ACTIVE },
    { plateNumber: 'AA-67890', vehicleName: 'Isuzu NQR', brand: 'Isuzu', model: 'NQR', manufacturingYear: 2023, fuelType: FuelType.DIESEL, tankCapacity: 100, averageFuelConsumption: 6, currentOdometer: 28000, status: VehicleStatus.ACTIVE },
    { plateNumber: 'AA-11111', vehicleName: 'Hyundai H-100', brand: 'Hyundai', model: 'H-100', manufacturingYear: 2020, fuelType: FuelType.DIESEL, tankCapacity: 65, averageFuelConsumption: 9, currentOdometer: 78000, status: VehicleStatus.ACTIVE },
    { plateNumber: 'AA-22222', vehicleName: 'Mitsubishi L200', brand: 'Mitsubishi', model: 'L200', manufacturingYear: 2022, fuelType: FuelType.DIESEL, tankCapacity: 75, averageFuelConsumption: 11, currentOdometer: 35000, status: VehicleStatus.ACTIVE },
  ]);
  console.log('✅ 5 vehicles created');

  // 4. Create Drivers
  const driverData = [
    { fullName: 'Abebe Kebede', phoneNumber: '+251911223344', licenseNumber: 'DL-001', vehicle: 0 },
    { fullName: 'Bekele Tadesse', phoneNumber: '+251922334455', licenseNumber: 'DL-002', vehicle: 1 },
    { fullName: 'Chala Dereje', phoneNumber: '+251933445566', licenseNumber: 'DL-003', vehicle: 2 },
    { fullName: 'Dawit Eshetu', phoneNumber: '+251944556677', licenseNumber: 'DL-004', vehicle: 3 },
    { fullName: 'Eyob Fikadu', phoneNumber: '+251955667788', licenseNumber: 'DL-005', vehicle: 4 },
  ];

  const drivers = [];
  for (const d of driverData) {
    const username = d.fullName.toLowerCase().split(' ').join('.');
    const passHash = await bcrypt.hash('Driver@123', 12);
    const user = await User.create({ username, passwordHash: passHash, role: UserRole.DRIVER, isActive: true, mustChangePassword: true });
    const driver = await Driver.create({ fullName: d.fullName, phoneNumber: d.phoneNumber, licenseNumber: d.licenseNumber, assignedVehicleId: vehicles[d.vehicle]._id, status: DriverStatus.ACTIVE, userId: user._id });
    user.driverId = driver._id as any;
    await user.save();
    drivers.push(driver);
  }
  console.log('✅ 5 drivers created (password: Driver@123)');

  // 5. Create Sample Transactions
  const now = new Date();
  const transactions = [
    // Normal transaction
    { vehicleId: vehicles[0]._id, driverId: drivers[0]._id, fuelStationName: 'NOC Bole', fuelType: FuelType.DIESEL, fuelQuantity: 32, pricePerLiter: 72.5, totalAmount: 2320, odometerReading: 45300, previousOdometer: 45000, distanceTraveled: 300, expectedFuel: 30, fuelDifference: 2, variancePercentage: 6.67, receiptNumber: 'RCP-001', fuelDate: new Date(now.getTime() - 86400000 * 5), submittedAt: new Date(now.getTime() - 86400000 * 5), status: TransactionStatus.NORMAL, riskScore: 0, riskLevel: RiskLevel.LOW, fraudReasons: [], reviewStatus: ReviewStatus.PENDING },
    // Warning transaction
    { vehicleId: vehicles[1]._id, driverId: drivers[1]._id, fuelStationName: 'Total Megenagna', fuelType: FuelType.DIESEL, fuelQuantity: 55, pricePerLiter: 72.5, totalAmount: 3987.5, odometerReading: 62400, previousOdometer: 62000, distanceTraveled: 400, expectedFuel: 50, fuelDifference: 5, variancePercentage: 10, receiptNumber: 'RCP-002', fuelDate: new Date(now.getTime() - 86400000 * 4), submittedAt: new Date(now.getTime() - 86400000 * 4), status: TransactionStatus.NORMAL, riskScore: 0, riskLevel: RiskLevel.LOW, fraudReasons: [], reviewStatus: ReviewStatus.PENDING },
    // High-risk transaction (>40% variance)
    { vehicleId: vehicles[0]._id, driverId: drivers[0]._id, fuelStationName: 'YBS Fuel Arat Kilo', fuelType: FuelType.DIESEL, fuelQuantity: 45, pricePerLiter: 72.5, totalAmount: 3262.5, odometerReading: 45600, previousOdometer: 45300, distanceTraveled: 300, expectedFuel: 30, fuelDifference: 15, variancePercentage: 50, receiptNumber: 'RCP-003', fuelDate: new Date(now.getTime() - 86400000 * 3), submittedAt: new Date(now.getTime() - 86400000 * 3), status: TransactionStatus.HIGH_RISK, riskScore: 80, riskLevel: RiskLevel.HIGH, fraudReasons: ['Fuel exceeds expected consumption by more than 20%.', 'Fuel exceeds expected consumption by more than 40%.'], reviewStatus: ReviewStatus.PENDING },
    // Duplicate receipt (critical)
    { vehicleId: vehicles[2]._id, driverId: drivers[2]._id, fuelStationName: 'NOC CMC', fuelType: FuelType.DIESEL, fuelQuantity: 42, pricePerLiter: 72.5, totalAmount: 3045, odometerReading: 28200, previousOdometer: 28000, distanceTraveled: 200, expectedFuel: 33.33, fuelDifference: 8.67, variancePercentage: 26.01, receiptNumber: 'RCP-003', fuelDate: new Date(now.getTime() - 86400000 * 2), submittedAt: new Date(now.getTime() - 86400000 * 2), status: TransactionStatus.WARNING, riskScore: 130, riskLevel: RiskLevel.CRITICAL, fraudReasons: ['Fuel exceeds expected consumption by more than 20%.', 'Duplicate receipt number detected.', 'Fuel exceeds expected consumption by more than 40%.'], reviewStatus: ReviewStatus.PENDING },
    // Multiple fueling same day
    { vehicleId: vehicles[3]._id, driverId: drivers[3]._id, fuelStationName: 'Oilibya Piassa', fuelType: FuelType.DIESEL, fuelQuantity: 35, pricePerLiter: 72.5, totalAmount: 2537.5, odometerReading: 78200, previousOdometer: 78000, distanceTraveled: 200, expectedFuel: 22.22, fuelDifference: 12.78, variancePercentage: 57.52, receiptNumber: 'RCP-005', fuelDate: new Date(now.getTime() - 86400000), submittedAt: new Date(now.getTime() - 86400000), status: TransactionStatus.HIGH_RISK, riskScore: 100, riskLevel: RiskLevel.HIGH, fraudReasons: ['Fuel exceeds expected consumption by more than 20%.', 'Fuel exceeds expected consumption by more than 40%.', 'Vehicle was fueled more than once on the same day.'], reviewStatus: ReviewStatus.PENDING },
    { vehicleId: vehicles[3]._id, driverId: drivers[3]._id, fuelStationName: 'Total Sarbet', fuelType: FuelType.DIESEL, fuelQuantity: 30, pricePerLiter: 72.5, totalAmount: 2175, odometerReading: 78400, previousOdometer: 78200, distanceTraveled: 200, expectedFuel: 22.22, fuelDifference: 7.78, variancePercentage: 35.02, receiptNumber: 'RCP-006', fuelDate: new Date(now.getTime() - 86400000), submittedAt: new Date(now.getTime() - 86400000), status: TransactionStatus.HIGH_RISK, riskScore: 50, riskLevel: RiskLevel.MEDIUM, fraudReasons: ['Fuel exceeds expected consumption by more than 20%.'], reviewStatus: ReviewStatus.PENDING },
    // Normal recent
    { vehicleId: vehicles[4]._id, driverId: drivers[4]._id, fuelStationName: 'NOC Mexico', fuelType: FuelType.DIESEL, fuelQuantity: 28, pricePerLiter: 72.5, totalAmount: 2030, odometerReading: 35300, previousOdometer: 35000, distanceTraveled: 300, expectedFuel: 27.27, fuelDifference: 0.73, variancePercentage: 2.68, receiptNumber: 'RCP-007', fuelDate: now, submittedAt: now, status: TransactionStatus.NORMAL, riskScore: 0, riskLevel: RiskLevel.LOW, fraudReasons: [], reviewStatus: ReviewStatus.PENDING },
  ];

  await FuelTransaction.insertMany(transactions);

  // Update vehicle odometers
  await Vehicle.findByIdAndUpdate(vehicles[0]._id, { currentOdometer: 45600 });
  await Vehicle.findByIdAndUpdate(vehicles[1]._id, { currentOdometer: 62400 });
  await Vehicle.findByIdAndUpdate(vehicles[2]._id, { currentOdometer: 28200 });
  await Vehicle.findByIdAndUpdate(vehicles[3]._id, { currentOdometer: 78400 });
  await Vehicle.findByIdAndUpdate(vehicles[4]._id, { currentOdometer: 35300 });

  // Create notifications for owner
  await Notification.insertMany([
    { recipientUserId: owner._id, type: 'HIGH_RISK_TRANSACTION', title: 'High-Risk Transaction Detected', message: 'High-risk fuel transaction for vehicle AA-12345 by Abebe Kebede. Risk score: 80.', isRead: false },
    { recipientUserId: owner._id, type: 'CRITICAL_FRAUD', title: 'Critical Fraud Alert', message: 'CRITICAL fraud alert for vehicle AA-67890. Duplicate receipt & high variance detected. Score: 130.', isRead: false },
    { recipientUserId: owner._id, type: 'HIGH_RISK_TRANSACTION', title: 'High-Risk Transaction', message: 'Multiple fueling detected for vehicle AA-11111 by Dawit Eshetu. Risk score: 100.', isRead: false },
  ]);

  console.log('✅ 7 fuel transactions created');
  console.log('✅ 3 notifications created');
  console.log('\n🎉 Seed complete!\n');
  console.log('Owner Login: admin / Admin@12345');
  console.log('Driver Login: abebe.kebede / Driver@123 (must change password)');
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
