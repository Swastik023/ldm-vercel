import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * FeeRecord — stores fee details per student admission.
 * All financial calculations should use the calcFees() utility to stay centralized.
 */

export interface IPaymentEntry {
    amount: number;
    date: Date;
    method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Online';
    note?: string;
}

export interface IFeeRecord extends Document {
    studentId: mongoose.Types.ObjectId;
    studentName: string;            // Denormalized for quick display
    course: string;
    baseCoursePrice: number;        // Price at time of admission (locked)
    discountPercent: number;        // 0–100
    discountAmount: number;         // Calculated from discountPercent OR manual flat
    finalFees: number;              // baseCoursePrice - discountAmount
    amountPaid: number;             // Sum of all payment entries
    remainingAmount: number;        // finalFees - amountPaid
    globalOfferApplied?: string;    // If a global offer was applied (label)
    payments: IPaymentEntry[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentEntrySchema = new Schema<IPaymentEntry>({
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    method: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Online'], required: true },
    note: String,
}, { _id: false });

const FeeRecordSchema = new Schema<IFeeRecord>({
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentName: { type: String, required: true },
    course: { type: String, required: true },
    baseCoursePrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0 },
    finalFees: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    globalOfferApplied: String,
    payments: { type: [PaymentEntrySchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const FeeRecord: Model<IFeeRecord> =
    mongoose.models.FeeRecord || mongoose.model<IFeeRecord>('FeeRecord', FeeRecordSchema);
