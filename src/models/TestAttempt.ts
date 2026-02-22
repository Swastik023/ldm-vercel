import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAnswerEntry {
    questionIndex: number;
    selectedOption: string; // 'A', 'B', 'C', or 'D'
}

export interface ITestAttempt extends Document {
    testId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    answers: IAnswerEntry[];
    score: number;
    totalQuestions: number;
    percentage: number;
    submittedAt: Date;
}

const AnswerSchema = new Schema<IAnswerEntry>(
    { questionIndex: Number, selectedOption: String },
    { _id: false }
);

const TestAttemptSchema = new Schema<ITestAttempt>(
    {
        testId: { type: Schema.Types.ObjectId, ref: 'Test', required: true },
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        answers: { type: [AnswerSchema], default: [] },
        score: { type: Number, default: 0 },
        totalQuestions: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        submittedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// One attempt per student per test
TestAttemptSchema.index({ testId: 1, studentId: 1 }, { unique: true });

export const TestAttempt: Model<ITestAttempt> =
    mongoose.models.TestAttempt || mongoose.model<ITestAttempt>('TestAttempt', TestAttemptSchema);
