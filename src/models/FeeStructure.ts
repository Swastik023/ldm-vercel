import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeeStructure extends Document {
    program: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    semester: number;
    total_amount: number;
    due_date: Date;
    description: string;
    is_active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FeeStructureSchema = new Schema<IFeeStructure>({
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    semester: { type: Number, required: true },
    total_amount: { type: Number, required: true, min: 1 },
    due_date: { type: Date, required: true },
    description: { type: String, default: '' },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const FeeStructure: Model<IFeeStructure> =
    mongoose.models.FeeStructure || mongoose.model<IFeeStructure>('FeeStructure', FeeStructureSchema);
