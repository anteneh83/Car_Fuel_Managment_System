import mongoose, { Schema, Document } from 'mongoose';

export interface IFraudRule extends Document {
  name: string;
  description: string;
  code: string;
  score: number;
  threshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FraudRuleSchema = new Schema<IFraudRule>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    score: { type: Number, required: true },
    threshold: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FraudRule = mongoose.model<IFraudRule>('FraudRule', FraudRuleSchema);
