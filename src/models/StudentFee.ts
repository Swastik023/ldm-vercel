import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPaymentEntry {
    _id?: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
    note?: string;
    addedBy: mongoose.Types.ObjectId;
}

export interface IStudentFee extends Document {
    studentId: mongoose.Types.ObjectId;
    batchId?: mongoose.Types.ObjectId;          // Link to batch → course → baseFee
    courseId?: string;                           // CoursePricing.courseId

    feeLabel: string;                            // e.g. "Annual Fee", "Semester 1"
    academicYear: string;                        // e.g. "2024-25"

    baseFee: number;                             // Raw fee from course pricing
    discountPct: number;                         // 0–100  (auto-calc or manual)
    finalFee: number;                            // baseFee – (baseFee × discountPct / 100)

    amountPaid: number;                          // sum of payments[].amount
    // amountRemaining = finalFee - amountPaid  (virtual)

    payments: IPaymentEntry[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PaymentEntrySchema = new Schema<IPaymentEntry>(
    {
        amount: { type: Number, required: true, min: 0.01 },
        date: { type: Date, required: true, default: Date.now },
        note: { type: String },
        addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { _id: true, timestamps: false }
);

const StudentFeeSchema = new Schema<IStudentFee>(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        batchId: { type: Schema.Types.ObjectId, ref: 'Batch' },
        courseId: { type: String },

        feeLabel: { type: String, required: true, default: 'Course Fee' },
        academicYear: { type: String, required: true },

        baseFee: { type: Number, required: true, min: 0 },
        discountPct: { type: Number, default: 0, min: 0, max: 100 },
        finalFee: { type: Number, required: true, min: 0 },

        amountPaid: { type: Number, default: 0, min: 0 },
        payments: { type: [PaymentEntrySchema], default: [] },
        notes: { type: String },
    },
    { timestamps: true }
);

// Virtual: amountRemaining
StudentFeeSchema.virtual('amountRemaining').get(function () {
    return Math.max(0, this.finalFee - this.amountPaid);
});

// Helper: recalculate finalFee from baseFee + discountPct
StudentFeeSchema.methods.applyDiscount = function () {
    this.finalFee = Math.round(this.baseFee - (this.baseFee * this.discountPct) / 100);
};

StudentFeeSchema.set('toJSON', { virtuals: true });
StudentFeeSchema.set('toObject', { virtuals: true });

export const StudentFee: Model<IStudentFee> =
    mongoose.models.StudentFee ||
    mongoose.model<IStudentFee>('StudentFee', StudentFeeSchema);
