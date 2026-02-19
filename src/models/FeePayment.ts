import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentTransaction {
    amount: number;
    paid_on: Date;
    mode: 'cash' | 'online' | 'cheque' | 'DD';
    receipt_no: string;
    remarks?: string;
    recorded_by: mongoose.Types.ObjectId;
}

export interface IFeePayment extends Document {
    student: mongoose.Types.ObjectId;
    fee_structure: mongoose.Types.ObjectId;
    amount_paid: number;
    payments: IPaymentTransaction[];
    status: 'unpaid' | 'partial' | 'paid';
    createdAt: Date;
    updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransaction>({
    amount: { type: Number, required: true, min: 1 },
    paid_on: { type: Date, required: true },
    mode: { type: String, enum: ['cash', 'online', 'cheque', 'DD'], required: true },
    receipt_no: { type: String, required: true },
    remarks: { type: String, default: '' },
    recorded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: true });

const FeePaymentSchema = new Schema<IFeePayment>({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fee_structure: { type: Schema.Types.ObjectId, ref: 'FeeStructure', required: true },
    amount_paid: { type: Number, default: 0 },
    payments: [PaymentTransactionSchema],
    status: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
}, { timestamps: true });

// Unique: one FeePayment document per student per fee structure
FeePaymentSchema.index({ student: 1, fee_structure: 1 }, { unique: true });

export const FeePayment: Model<IFeePayment> =
    mongoose.models.FeePayment || mongoose.model<IFeePayment>('FeePayment', FeePaymentSchema);
