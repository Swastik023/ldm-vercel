import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOption {
    label: string; // 'A', 'B', 'C', 'D'
    text: string;
}

export interface IQuestion {
    questionText: string;
    options: IOption[];
    correctAnswer: string; // 'A', 'B', 'C', or 'D'
}

export interface ITest extends Document {
    title: string;
    duration: number; // in minutes
    isActive: boolean;
    questions: IQuestion[];
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const OptionSchema = new Schema<IOption>({ label: String, text: String }, { _id: false });

const QuestionSchema = new Schema<IQuestion>(
    {
        questionText: { type: String, required: true },
        options: { type: [OptionSchema], required: true },
        correctAnswer: { type: String, required: true },
    },
    { _id: true }
);

const TestSchema = new Schema<ITest>(
    {
        title: { type: String, required: true, trim: true },
        duration: { type: Number, required: true, min: 1 },
        isActive: { type: Boolean, default: true },
        questions: { type: [QuestionSchema], validate: [(v: IQuestion[]) => v.length > 0, 'A test must have at least one question'] },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export const Test: Model<ITest> =
    mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);
