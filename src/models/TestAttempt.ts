import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Graded answer entry (stored after submission) ─────────────────────────
export interface IGradedAnswer {
    questionId: string;
    questionText: string;
    studentAnswer: string | null;     // null = skipped
    correctAnswer: string;
    reason: string;
    marksAwarded: number;             // positive or negative
    isCorrect: boolean;
}

// ─── Raw answer entry (from student during test) ───────────────────────────
export interface IStudentAnswer {
    questionId: string;
    selectedOption: 'A' | 'B' | 'C' | 'D' | null;
}

// ─── Violation entry ───────────────────────────────────────────────────────
export interface IViolation {
    type: 'tab_switch' | 'blur' | 'fullscreen_exit';
    count: number;
    timestamp: Date;
}

// ─── ProTestAttempt ────────────────────────────────────────────────────────
export interface IProTestAttempt extends Document {
    testId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    startedAt: Date;
    submittedAt: Date;
    status: 'submitted';
    // Raw answers stored for future re-grading support
    answers: IStudentAnswer[];
    // Computed on submit
    totalMarks: number;
    marksObtained: number;
    negativeMarks: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    percentage: number;
    // Result details (stored immediately)
    gradedAnswers: IGradedAnswer[];
    // Whether this student can see their result
    resultVisible: boolean;
    // Security violation log
    violations: IViolation[];
    createdAt: Date;
    updatedAt: Date;
}

const ViolationSchema = new Schema<IViolation>({
    type: { type: String, enum: ['tab_switch', 'blur', 'fullscreen_exit'], required: true },
    count: { type: Number, required: true },
    timestamp: { type: Date, required: true },
}, { _id: false });

const StudentAnswerSchema = new Schema<IStudentAnswer>({
    questionId: { type: String, required: true },
    selectedOption: { type: String, enum: ['A', 'B', 'C', 'D', null], default: null },
}, { _id: false });

const GradedAnswerSchema = new Schema<IGradedAnswer>({
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    studentAnswer: { type: String, default: null },
    correctAnswer: { type: String, required: true },
    reason: { type: String, default: '' },
    marksAwarded: { type: Number, required: true },
    isCorrect: { type: Boolean, required: true },
}, { _id: false });

const ProTestAttemptSchema = new Schema<IProTestAttempt>({
    testId: { type: Schema.Types.ObjectId, ref: 'ProTest', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date, required: true },
    status: { type: String, enum: ['submitted'], default: 'submitted' },
    answers: { type: [StudentAnswerSchema], default: [] },
    totalMarks: { type: Number, required: true },
    marksObtained: { type: Number, required: true },
    negativeMarks: { type: Number, default: 0 },
    correctCount: { type: Number, default: 0 },
    wrongCount: { type: Number, default: 0 },
    skippedCount: { type: Number, default: 0 },
    percentage: { type: Number, required: true },
    gradedAnswers: { type: [GradedAnswerSchema], default: [] },
    resultVisible: { type: Boolean, default: false },
    violations: { type: [ViolationSchema], default: [] },
}, { timestamps: true });

// One attempt per student per test
ProTestAttemptSchema.index({ testId: 1, studentId: 1 }, { unique: true });

export const ProTestAttempt: Model<IProTestAttempt> =
    mongoose.models.ProTestAttempt || mongoose.model<IProTestAttempt>('ProTestAttempt', ProTestAttemptSchema);
