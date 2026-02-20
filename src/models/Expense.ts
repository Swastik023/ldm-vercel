import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
    title: string;
    amount: number;
    category: 'utilities' | 'maintenance' | 'supplies' | 'events' | 'salary' | 'other';
    paid_on: Date;
    paid_to: string;
    remarks?: string;
    recorded_by: mongoose.Types.ObjectId;

    // Audit & Security Fields
    is_deleted: boolean;
    deleted_by?: mongoose.Types.ObjectId;
    deleted_at?: Date;
    deletion_reason?: string;

    is_locked: boolean;
    locked_by?: mongoose.Types.ObjectId;
    locked_at?: Date;

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

    is_deleted: { type: Boolean, default: false },
    deleted_by: { type: Schema.Types.ObjectId, ref: 'User' },
    deleted_at: { type: Date },
    deletion_reason: { type: String },

    is_locked: { type: Boolean, default: false },
    locked_by: { type: Schema.Types.ObjectId, ref: 'User' },
    locked_at: { type: Date },
}, { timestamps: true });

export const Expense: Model<IExpense> =
    mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);
