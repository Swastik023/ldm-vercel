import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISalary extends Document {
    employee: mongoose.Types.ObjectId;
    month: string; // "YYYY-MM"
    base_amount: number;
    deductions: number;
    net_amount: number; // base - deductions (stored as historical record)
    status: 'pending' | 'paid';
    paid_on?: Date;
    paid_by?: mongoose.Types.ObjectId;
    remarks?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SalarySchema = new Schema<ISalary>({
    employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // "2025-01"
    base_amount: { type: Number, required: true, min: 1 },
    deductions: { type: Number, default: 0, min: 0 },
    net_amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paid_on: { type: Date, default: null },
    paid_by: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    remarks: { type: String, default: '' },
}, { timestamps: true });

// Prevent duplicate salary for same employee and month
SalarySchema.index({ employee: 1, month: 1 }, { unique: true });

export const Salary: Model<ISalary> =
    mongoose.models.Salary || mongoose.model<ISalary>('Salary', SalarySchema);
