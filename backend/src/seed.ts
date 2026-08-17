import bcrypt from 'bcryptjs';
import { config } from './config';
import { connectDB } from './config/database';
import { User } from './models/User';
import { Driver } from './models/Driver';
import { Vehicle } from './models/Vehicle';
import { FuelRequest } from './models/FuelRequest';
import { FuelTransaction } from './models/FuelTransaction';
import { FraudRule } from './models/FraudRule';
import { Notification } from './models/Notification';
import { AuditLog } from './models/AuditLog';
import {
  UserRole,
  DriverStatus,
  VehicleStatus,
  FuelType,
  FuelRequestStatus,
  RiskLevel,
  ReviewStatus,
  TransactionStatus,
} from './types';

async function seed() {
  await connectDB();
  console.log('🌱 Seeding database for FFFDMS v2...');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Driver.deleteMany({}),
    Vehicle.deleteMany({}),
    FuelRequest.deleteMany({}),
    FuelTransaction.deleteMany({}),
    FraudRule.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);

  // 1. Create Admin/Owner
  const ownerHash = await bcrypt.hash(config.owner.password, 12);
  const owner = await User.create({
    username: config.owner.username,
    fullName: 'System Administrator',
    passwordHash: ownerHash,
    role: UserRole.OWNER,
    isActive: true,
    mustChangePassword: false,
  });
  console.log(`✅ Owner: ${config.owner.username} / ${config.owner.password}`);

  // 2. Create Monitor (Operational Users)
  const monitorHash = await bcrypt.hash('Monitor@12345', 12);
  const monitor = await User.create({
    username: 'monitor01',
    fullName: 'Monitor 01',
    passwordHash: monitorHash,
    role: UserRole.MONITOR,
    isActive: true,
    mustChangePassword: false,
  });

  // Also create 'monitor' username for convenience
  await User.create({
    username: 'monitor',
    fullName: 'Monitor Dispatch',
    passwordHash: monitorHash,
    role: UserRole.MONITOR,
    isActive: true,
    mustChangePassword: false,
  });
  console.log(`✅ Monitor Accounts: monitor01 / Monitor@12345 and monitor / Monitor@12345`);

  // 3. Create Fraud Rules
  const fraudRules = [
    {
      name: 'Expected Fuel Exceeded',
      description: 'Fuel exceeds expected consumption by >20%',
      code: 'EXPECTED_FUEL_EXCEEDED',
      score: 30,
      threshold: 20,
    },
    {
      name: 'Severe Fuel Variance',
      description: 'Fuel exceeds expected consumption by >40%',
      code: 'SEVERE_FUEL_VARIANCE',
      score: 50,
      threshold: 40,
    },
    {
      name: 'Multiple Fueling Same Day',
      description: 'Vehicle fueled more than once on same day',
      code: 'MULTIPLE_FUELING_SAME_DAY',
      score: 20,
      threshold: 1,
    },
    {
      name: 'Monthly Above Average',
      description: 'Monthly consumption exceeds historical average by >30%',
      code: 'MONTHLY_ABOVE_AVERAGE',
      score: 20,
      threshold: 30,
    },
    {
      name: 'Duplicate Receipt',
      description: 'Same receipt number used twice',
      code: 'DUPLICATE_RECEIPT',
      score: 50,
      threshold: 0,
    },
    {
      name: 'Late Receipt',
      description: 'Receipt submitted >3 days after fueling',
      code: 'LATE_RECEIPT',
      score: 10,
      threshold: 3,
    },
    {
      name: 'Outside Working Hours',
      description: 'Transaction outside 08:00-18:00',
      code: 'OUTSIDE_WORKING_HOURS',
      score: 10,
      threshold: 0,
    },
    {
      name: 'Repeated Fuel Station',
      description: 'Driver uses same station >70% of the time',
      code: 'REPEATED_FUEL_STATION',
      score: 10,
      threshold: 70,
    },
    {
      name: 'Repeated Rounded Quantities',
      description: 'Multiple rounded fuel quantities',
      code: 'REPEATED_ROUNDED_QUANTITIES',
      score: 10,
      threshold: 4,
    },
  ];
  await FraudRule.insertMany(fraudRules);
  console.log('✅ 9 Fraud rules created');

  // 4. Create Vehicles
  const vehicles = await Vehicle.insertMany([
    {
      plateNumber: 'AA-12345',
      vehicleName: 'Toyota Hilux',
      brand: 'Toyota',
      model: 'Hilux',
      manufacturingYear: 2022,
      fuelType: FuelType.DIESEL,
      tankCapacity: 80,
      averageFuelConsumption: 10,
      currentOdometer: 45000,
      status: VehicleStatus.ACTIVE,
    },
    {
      plateNumber: 'AA-54321',
      vehicleName: 'Toyota Land Cruiser',
      brand: 'Toyota',
      model: 'Land Cruiser',
      manufacturingYear: 2021,
      fuelType: FuelType.DIESEL,
      tankCapacity: 93,
      averageFuelConsumption: 8,
      currentOdometer: 62000,
      status: VehicleStatus.ACTIVE,
    },
    {
      plateNumber: 'AA-67890',
      vehicleName: 'Isuzu NQR',
      brand: 'Isuzu',
      model: 'NQR',
      manufacturingYear: 2023,
      fuelType: FuelType.DIESEL,
      tankCapacity: 100,
      averageFuelConsumption: 6,
      currentOdometer: 28000,
      status: VehicleStatus.ACTIVE,
    },
    {
      plateNumber: 'AA-11111',
      vehicleName: 'Hyundai H-100',
      brand: 'Hyundai',
      model: 'H-100',
      manufacturingYear: 2020,
      fuelType: FuelType.DIESEL,
      tankCapacity: 65,
      averageFuelConsumption: 9,
      currentOdometer: 78000,
      status: VehicleStatus.ACTIVE,
    },
    {
      plateNumber: 'AA-22222',
      vehicleName: 'Mitsubishi L200',
      brand: 'Mitsubishi',
      model: 'L200',
      manufacturingYear: 2022,
      fuelType: FuelType.DIESEL,
      tankCapacity: 75,
      averageFuelConsumption: 11,
      currentOdometer: 35000,
      status: VehicleStatus.ACTIVE,
    },
  ]);
  console.log('✅ 5 vehicles created');

  // 5. Create Drivers as managed entities (NO accounts/passwords)
  const drivers = await Driver.insertMany([
    {
      fullName: 'Abebe Kebede',
      phoneNumber: '+251911223344',
      licenseNumber: 'ETH-DL-001',
      assignedVehicleId: vehicles[0]._id,
      status: DriverStatus.ACTIVE,
    },
    {
      fullName: 'Bekele Tadesse',
      phoneNumber: '+251922334455',
      licenseNumber: 'ETH-DL-002',
      assignedVehicleId: vehicles[1]._id,
      status: DriverStatus.ACTIVE,
    },
    {
      fullName: 'Chala Dereje',
      phoneNumber: '+251933445566',
      licenseNumber: 'ETH-DL-003',
      assignedVehicleId: vehicles[2]._id,
      status: DriverStatus.ACTIVE,
    },
    {
      fullName: 'Dawit Eshetu',
      phoneNumber: '+251944556677',
      licenseNumber: 'ETH-DL-004',
      assignedVehicleId: vehicles[3]._id,
      status: DriverStatus.ACTIVE,
    },
    {
      fullName: 'Eyob Fikadu',
      phoneNumber: '+251955667788',
      licenseNumber: 'ETH-DL-005',
      assignedVehicleId: vehicles[4]._id,
      status: DriverStatus.ACTIVE,
    },
  ]);
  console.log('✅ 5 drivers created (managed entities without login accounts)');

  // 6. Create Phase 1 Fuel Requests
  const mockOdometerImage = {
    secureUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    publicId: 'sample_odometer',
    resourceType: 'image',
    format: 'jpg',
    originalFilename: 'odometer_45300.jpg',
    uploadedAt: new Date(),
  };

  const fuelRequests = await FuelRequest.insertMany([
    // Approved request 1 (completed below as transaction 1)
    {
      driverId: drivers[0]._id,
      vehicleId: vehicles[0]._id,
      monitorId: monitor._id,
      fuelType: FuelType.DIESEL,
      fuelQuantity: 32,
      pricePerLiter: 72.5,
      odometerReading: 45300,
      previousOdometer: 45000,
      distanceSincePrevious: 300,
      estimatedExpectedFuel: 30,
      estimatedVariance: 6.67,
      estimatedTotalAmount: 2320,
      odometerImage: mockOdometerImage,
      status: FuelRequestStatus.APPROVED,
      approvedBy: owner._id,
      approvedAt: new Date(Date.now() - 86400000 * 5),
    },
    // Approved request 2 (completed below as transaction 2)
    {
      driverId: drivers[1]._id,
      vehicleId: vehicles[1]._id,
      monitorId: monitor._id,
      fuelType: FuelType.DIESEL,
      fuelQuantity: 55,
      pricePerLiter: 72.5,
      odometerReading: 62400,
      previousOdometer: 62000,
      distanceSincePrevious: 400,
      estimatedExpectedFuel: 50,
      estimatedVariance: 10,
      estimatedTotalAmount: 3987.5,
      odometerImage: mockOdometerImage,
      status: FuelRequestStatus.APPROVED,
      approvedBy: owner._id,
      approvedAt: new Date(Date.now() - 86400000 * 4),
    },
    // Approved request 3 (completed below as transaction 3 - high risk)
    {
      driverId: drivers[0]._id,
      vehicleId: vehicles[0]._id,
      monitorId: monitor._id,
      fuelType: FuelType.DIESEL,
      fuelQuantity: 45,
      pricePerLiter: 72.5,
      odometerReading: 45600,
      previousOdometer: 45300,
      distanceSincePrevious: 300,
      estimatedExpectedFuel: 30,
      estimatedVariance: 50,
      estimatedTotalAmount: 3262.5,
      odometerImage: mockOdometerImage,
      status: FuelRequestStatus.APPROVED,
      approvedBy: owner._id,
      approvedAt: new Date(Date.now() - 86400000 * 3),
    },
    // Pending request waiting for Admin review
    {
      driverId: drivers[2]._id,
      vehicleId: vehicles[2]._id,
      monitorId: monitor._id,
      fuelType: FuelType.DIESEL,
      fuelQuantity: 40,
      pricePerLiter: 72.5,
      odometerReading: 28300,
      previousOdometer: 28000,
      distanceSincePrevious: 300,
      estimatedExpectedFuel: 50,
      estimatedVariance: -20,
      estimatedTotalAmount: 2900,
      odometerImage: mockOdometerImage,
      status: FuelRequestStatus.PENDING,
    },
    // Rejected request
    {
      driverId: drivers[3]._id,
      vehicleId: vehicles[3]._id,
      monitorId: monitor._id,
      fuelType: FuelType.DIESEL,
      fuelQuantity: 60,
      pricePerLiter: 72.5,
      odometerReading: 78500,
      previousOdometer: 78000,
      distanceSincePrevious: 500,
      estimatedExpectedFuel: 55.55,
      estimatedVariance: 8,
      estimatedTotalAmount: 4350,
      odometerImage: mockOdometerImage,
      status: FuelRequestStatus.REJECTED,
      rejectedBy: owner._id,
      rejectedAt: new Date(Date.now() - 86400000),
      rejectionReason: 'Entered odometer reading does not match the uploaded odometer image.',
    },
  ]);
  console.log('✅ 5 fuel requests created (3 APPROVED, 1 PENDING, 1 REJECTED)');

  // 7. Create Phase 2 Completed Transactions linked to Approved Requests
  const now = new Date();
  const transactions = [
    // Normal transaction
    {
      fuelRequestId: fuelRequests[0]._id,
      vehicleId: vehicles[0]._id,
      driverId: drivers[0]._id,
      monitorId: monitor._id,
      fuelStationName: 'NOC Bole',
      fuelType: FuelType.DIESEL,
      fuelQuantity: 32,
      pricePerLiter: 72.5,
      totalAmount: 2320,
      odometerReading: 45300,
      previousOdometer: 45000,
      distanceTraveled: 300,
      expectedFuel: 30,
      fuelDifference: 2,
      variancePercentage: 6.67,
      receiptNumber: 'RCP-001',
      fuelDate: new Date(now.getTime() - 86400000 * 5),
      submittedAt: new Date(now.getTime() - 86400000 * 5),
      status: TransactionStatus.NORMAL,
      riskScore: 0,
      riskLevel: RiskLevel.LOW,
      fraudReasons: [],
      reviewStatus: ReviewStatus.PENDING,
    },
    // Normal/Warning transaction
    {
      fuelRequestId: fuelRequests[1]._id,
      vehicleId: vehicles[1]._id,
      driverId: drivers[1]._id,
      monitorId: monitor._id,
      fuelStationName: 'Total Megenagna',
      fuelType: FuelType.DIESEL,
      fuelQuantity: 55,
      pricePerLiter: 72.5,
      totalAmount: 3987.5,
      odometerReading: 62400,
      previousOdometer: 62000,
      distanceTraveled: 400,
      expectedFuel: 50,
      fuelDifference: 5,
      variancePercentage: 10,
      receiptNumber: 'RCP-002',
      fuelDate: new Date(now.getTime() - 86400000 * 4),
      submittedAt: new Date(now.getTime() - 86400000 * 4),
      status: TransactionStatus.NORMAL,
      riskScore: 0,
      riskLevel: RiskLevel.LOW,
      fraudReasons: [],
      reviewStatus: ReviewStatus.PENDING,
    },
    // High-risk transaction (>40% variance)
    {
      fuelRequestId: fuelRequests[2]._id,
      vehicleId: vehicles[0]._id,
      driverId: drivers[0]._id,
      monitorId: monitor._id,
      fuelStationName: 'YBS Fuel Arat Kilo',
      fuelType: FuelType.DIESEL,
      fuelQuantity: 45,
      pricePerLiter: 72.5,
      totalAmount: 3262.5,
      odometerReading: 45600,
      previousOdometer: 45300,
      distanceTraveled: 300,
      expectedFuel: 30,
      fuelDifference: 15,
      variancePercentage: 50,
      receiptNumber: 'RCP-003',
      fuelDate: new Date(now.getTime() - 86400000 * 3),
      submittedAt: new Date(now.getTime() - 86400000 * 3),
      status: TransactionStatus.HIGH_RISK,
      riskScore: 80,
      riskLevel: RiskLevel.HIGH,
      fraudReasons: [
        'Fuel exceeds expected consumption by more than 20%.',
        'Fuel exceeds expected consumption by more than 40%.',
      ],
      reviewStatus: ReviewStatus.PENDING,
    },
  ];

  await FuelTransaction.insertMany(transactions);

  // Update vehicle odometers
  await Vehicle.findByIdAndUpdate(vehicles[0]._id, { currentOdometer: 45600 });
  await Vehicle.findByIdAndUpdate(vehicles[1]._id, { currentOdometer: 62400 });

  // Notifications for owner
  await Notification.insertMany([
    {
      recipientUserId: owner._id,
      type: 'FUEL_REQUEST_SUBMITTED',
      title: 'New Fuel Request',
      message: 'New fuel request submitted by monitor for driver Chala Dereje, vehicle AA-67890. Quantity: 40L.',
      isRead: false,
    },
    {
      recipientUserId: owner._id,
      type: 'HIGH_RISK_TRANSACTION',
      title: 'High-Risk Transaction Detected',
      message: 'High-risk fuel transaction for vehicle AA-12345 by Abebe Kebede. Risk score: 80.',
      isRead: false,
    },
  ]);

  console.log('✅ 3 completed fuel transactions created');
  console.log('✅ 2 notifications created');
  console.log('\n🎉 Seed complete for FFFDMS v2!\n');
  console.log('Owner / Admin Login: admin / Admin@12345');
  console.log('Monitor Login: monitor01 / Monitor@12345');
  console.log('Drivers: 5 managed entities (no login required)\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
