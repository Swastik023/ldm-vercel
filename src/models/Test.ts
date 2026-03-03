import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Option ────────────────────────────────────────────────────────────────
export interface ITestOption {
    label: 'A' | 'B' | 'C' | 'D';
    text: string;
}

// ─── Question ──────────────────────────────────────────────────────────────
export interface ITestQuestion {
    questionId: string;   // Unique within test, matches answers.json
    sectionId?: string;
    type: 'mcq';
    questionText: string;
    marks: number;
    options: ITestOption[];
}

// ─── Section ───────────────────────────────────────────────────────────────
export interface ITestSection {
    sectionId: string;
    title: string;
    instructions?: string;
}

// ─── ProTest ───────────────────────────────────────────────────────────────
export interface IProTest extends Document {
    title: string;
    description?: string;
    durationMinutes: number;
    totalMarks: number;
    batch: mongoose.Types.ObjectId;        // Student batch filter
    subject: mongoose.Types.ObjectId;      // Subject filter
    negativeMarking: number;               // Marks deducted per wrong answer (0 = disabled)
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    resultMode: 'instant' | 'manual';
    isPublished: boolean;                  // Admin publishes results for manual mode
    isActive: boolean;
    createdBy: mongoose.Types.ObjectId;
    sections: ITestSection[];
    questions: ITestQuestion[];
    createdAt: Date;
    updatedAt: Date;
}

const OptionSchema = new Schema<ITestOption>({ label: String, text: String }, { _id: false });

const QuestionSchema = new Schema<ITestQuestion>({
    questionId: { type: String, required: true },
    sectionId: { type: String },
    type: { type: String, enum: ['mcq'], default: 'mcq' },
    questionText: { type: String, required: true },
    marks: { type: Number, required: true, min: 0 },
    options: { type: [OptionSchema], required: true },
}, { _id: false });

const SectionSchema = new Schema<ITestSection>({
    sectionId: { type: String, required: true },
    title: { type: String, required: true },
    instructions: { type: String },
}, { _id: false });

const ProTestSchema = new Schema<IProTest>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    durationMinutes: { type: Number, required: true, min: 1 },
    totalMarks: { type: Number, required: true, min: 1 },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    negativeMarking: { type: Number, default: 0, min: 0 },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    resultMode: { type: String, enum: ['instant', 'manual'], default: 'instant' },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sections: { type: [SectionSchema], default: [] },
    questions: {
        type: [QuestionSchema],
        validate: [(v: ITestQuestion[]) => v.length > 0, 'A test must have at least one question'],
    },
}, { timestamps: true });

export const ProTest: Model<IProTest> =
    mongoose.models.ProTest || mongoose.model<IProTest>('ProTest', ProTestSchema);
