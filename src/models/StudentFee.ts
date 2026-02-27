import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFeeEntry {
    amount: number;
    date: Date;
    note?: string;
    addedBy: mongoose.Types.ObjectId; // admin user ID
}

export interface IStudentFee extends Document {
    studentId: mongoose.Types.ObjectId;
    totalFee: number;           // Admin sets this
    amountPaid: number;         // Calculated from payments
    payments: IFeeEntry[];      // History of payments
    feeLabel: string;           // e.g. "Semester 1 Fee", "Annual Fee"
    academicYear: string;       // e.g. "2024-25"
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const FeeEntrySchema = new Schema<IFeeEntry>({
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { _id: true, timestamps: false });

const StudentFeeSchema = new Schema<IStudentFee>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        totalFee: { type: Number, required: true, min: 0 },
        amountPaid: { type: Number, default: 0, min: 0 },
        payments: { type: [FeeEntrySchema], default: [] },
        feeLabel: { type: String, required: true, default: 'Course Fee' },
        academicYear: { type: String, required: true },
        notes: { type: String },
    },
    { timestamps: true }
);

// Virtual: amountLeft
StudentFeeSchema.virtual('amountLeft').get(function () {
    return Math.max(0, this.totalFee - this.amountPaid);
});

StudentFeeSchema.set('toJSON', { virtuals: true });
StudentFeeSchema.set('toObject', { virtuals: true });

export const StudentFee: Model<IStudentFee> =
    mongoose.models.StudentFee ||
    mongoose.model<IStudentFee>('StudentFee', StudentFeeSchema);
