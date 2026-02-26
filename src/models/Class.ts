import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IClass extends Document {
    batchId: mongoose.Types.ObjectId;
    sessionFrom: number;  // e.g. 2024
    sessionTo: number;    // e.g. 2026
    className: string;    // auto-generated: "D.Pharma (2024-2026)"
    createdAt: Date;
}

const ClassSchema = new Schema<IClass>(
    {
        batchId: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
        sessionFrom: { type: Number, required: true },
        sessionTo: { type: Number, required: true },
        // Stored for fast reads; rebuilt if needed from batch.name + years
        className: { type: String, required: true },
    },
    { timestamps: true }
);

// A class is uniquely identified by batch + session span
ClassSchema.index({ batchId: 1, sessionFrom: 1, sessionTo: 1 }, { unique: true });

export const Class: Model<IClass> =
    mongoose.models.Class || mongoose.model<IClass>('Class', ClassSchema);
