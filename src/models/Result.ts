import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMark {
    student: mongoose.Types.ObjectId;
    marks_obtained: number;
    remarks?: string;
}

export interface IResult extends Document {
    session: mongoose.Types.ObjectId;
    program: mongoose.Types.ObjectId;
    semester: number;
    subject: mongoose.Types.ObjectId;
    teacher: mongoose.Types.ObjectId;
    batch: mongoose.Types.ObjectId;
    exam_type: 'midterm' | 'final' | 'practical' | 'assignment';
    max_marks: number;
    marks: IMark[];
    is_published: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MarkSchema = new Schema<IMark>({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    marks_obtained: { type: Number, required: true, min: 0 },
    remarks: { type: String }
}, { _id: false });

const ResultSchema = new Schema<IResult>({
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    semester: { type: Number, required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    exam_type: { type: String, enum: ['midterm', 'final', 'practical', 'assignment'], required: true },
    max_marks: { type: Number, required: true, default: 100 },
    marks: [MarkSchema],
    is_published: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure a teacher can only upload one result sheet per exam type for a specific batch/subject
ResultSchema.index({ batch: 1, subject: 1, exam_type: 1 }, { unique: true });

export const Result: Model<IResult> = mongoose.models.Result || mongoose.model<IResult>('Result', ResultSchema);
