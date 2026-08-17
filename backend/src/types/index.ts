import { Request } from 'express';

export enum UserRole {
  OWNER = 'OWNER',
  MONITOR = 'MONITOR',
}

export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum FuelType {
  PETROL = 'PETROL',
  DIESEL = 'DIESEL',
}

export enum FuelRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum TransactionStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  HIGH_RISK = 'HIGH_RISK',
  CRITICAL = 'CRITICAL',
}

export enum ReviewStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  INVESTIGATED = 'INVESTIGATED',
  RESOLVED = 'RESOLVED',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum AuditAction {
  DRIVER_CREATED = 'DRIVER_CREATED',
  DRIVER_UPDATED = 'DRIVER_UPDATED',
  DRIVER_DEACTIVATED = 'DRIVER_DEACTIVATED',
  VEHICLE_CREATED = 'VEHICLE_CREATED',
  VEHICLE_UPDATED = 'VEHICLE_UPDATED',
  VEHICLE_ARCHIVED = 'VEHICLE_ARCHIVED',
  FUEL_REQUEST_CREATED = 'FUEL_REQUEST_CREATED',
  FUEL_REQUEST_APPROVED = 'FUEL_REQUEST_APPROVED',
  FUEL_REQUEST_REJECTED = 'FUEL_REQUEST_REJECTED',
  FUEL_TRANSACTION_CREATED = 'FUEL_TRANSACTION_CREATED',
  FUEL_TRANSACTION_REVIEWED = 'FUEL_TRANSACTION_REVIEWED',
  FUEL_TRANSACTION_INVESTIGATED = 'FUEL_TRANSACTION_INVESTIGATED',
  FUEL_TRANSACTION_RESOLVED = 'FUEL_TRANSACTION_RESOLVED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  FRAUD_SCORE_CALCULATED = 'FRAUD_SCORE_CALCULATED',
}

export enum NotificationType {
  HIGH_RISK_TRANSACTION = 'HIGH_RISK_TRANSACTION',
  CRITICAL_FRAUD = 'CRITICAL_FRAUD',
  DUPLICATE_RECEIPT = 'DUPLICATE_RECEIPT',
  MONTHLY_THRESHOLD_EXCEEDED = 'MONTHLY_THRESHOLD_EXCEEDED',
  CONSUMPTION_INCREASE = 'CONSUMPTION_INCREASE',
  FUEL_REQUEST_SUBMITTED = 'FUEL_REQUEST_SUBMITTED',
  FUEL_REQUEST_APPROVED = 'FUEL_REQUEST_APPROVED',
  FUEL_REQUEST_REJECTED = 'FUEL_REQUEST_REJECTED',
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: UserRole;
  monitorId?: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: PaginationResult;
}

export interface CloudinaryMetadata {
  secureUrl: string;
  publicId: string;
  resourceType: string;
  format: string;
  originalFilename: string;
  uploadedAt: Date;
}

export interface FraudResult {
  riskScore: number;
  riskLevel: RiskLevel;
  fraudReasons: string[];
}

export interface FuelCalculation {
  distanceTraveled: number;
  expectedFuel: number;
  fuelDifference: number;
  variancePercentage: number;
}
