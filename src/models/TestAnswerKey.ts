import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Answer Entry ──────────────────────────────────────────────────────────
export interface IAnswerKeyEntry {
    questionId: string;
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    reason: string;
    marks: number;   // Per-question marks (copied from question for scoring)
}

// ─── TestAnswerKey — NEVER exposed to students ─────────────────────────────
export interface ITestAnswerKey extends Document {
    testId: mongoose.Types.ObjectId;
    answers: IAnswerKeyEntry[];
    createdAt: Date;
    updatedAt: Date;
}

const AnswerKeyEntrySchema = new Schema<IAnswerKeyEntry>({
    questionId: { type: String, required: true },
    correctAnswer: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
    reason: { type: String, default: '' },
    marks: { type: Number, required: true, min: 0 },
}, { _id: false });

const TestAnswerKeySchema = new Schema<ITestAnswerKey>({
    testId: { type: Schema.Types.ObjectId, ref: 'ProTest', required: true, unique: true },
    answers: { type: [AnswerKeyEntrySchema], required: true },
}, { timestamps: true });

export const TestAnswerKey: Model<ITestAnswerKey> =
    mongoose.models.TestAnswerKey || mongoose.model<ITestAnswerKey>('TestAnswerKey', TestAnswerKeySchema);
