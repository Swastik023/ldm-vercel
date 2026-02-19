import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
    title: string;
    amount: number;
    category: 'utilities' | 'maintenance' | 'supplies' | 'events' | 'salary' | 'other';
    paid_on: Date;
    paid_to: string;
    remarks?: string;
    recorded_by: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>({
    title: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    category: {
        type: String,
        enum: ['utilities', 'maintenance', 'supplies', 'events', 'salary', 'other'],
        required: true,
    },
    paid_on: { type: Date, required: true },
    paid_to: { type: String, required: true },
    remarks: { type: String, default: '' },
    recorded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
