import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Interfaces ---

export interface IProgram extends Document {
    name: string;
    code: string;
    description?: string;
    duration_years: number;
    total_semesters: number;
    is_active: boolean;
}

export interface ISession extends Document {
    name: string; // e.g., "2024-2025"
    start_date: Date;
    end_date: Date;
    is_active: boolean;
}

export interface ISubject extends Document {
    name: string;
    code: string;
    credits: number;
    program: mongoose.Types.ObjectId; // Reference to Program
    semester: number;
    type: 'theory' | 'practical' | 'elective';
    is_active: boolean;
}

export interface IBatch extends Document {
    name: string; // e.g., "Batch A"
    program: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    capacity: number;
    current_students: number;
    is_active: boolean;
}

export interface IAssignment extends Document {
    teacher: mongoose.Types.ObjectId; // Reference to User (Teacher)
    subject: mongoose.Types.ObjectId;
    batch?: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    section: string; // "A", "B", etc.
    assigned_at: Date;
}

// --- Schemas ---

const ProgramSchema = new Schema<IProgram>({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    duration_years: { type: Number, required: true },
    total_semesters: { type: Number, required: true },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

const SessionSchema = new Schema<ISession>({
    name: { type: String, required: true, unique: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    is_active: { type: Boolean, default: false },
}, { timestamps: true });

const SubjectSchema = new Schema<ISubject>({
    name: { type: String, required: true },
    code: { type: String, required: true },
    credits: { type: Number, required: true, default: 3 },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    semester: { type: Number, required: true },
    type: { type: String, enum: ['theory', 'practical', 'elective'], default: 'theory' },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });
// Ensure unique subject code within a program? Or globally? Usually globally unique or program specific.
SubjectSchema.index({ code: 1, program: 1 }, { unique: true });

const BatchSchema = new Schema<IBatch>({
    name: { type: String, required: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    capacity: { type: Number, default: 60 },
    current_students: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

const AssignmentSchema = new Schema<IAssignment>({
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' }, // Optional, maybe assigned to entire section without batch ID?
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    section: { type: String, required: true }, // e.g. 'A'
    assigned_at: { type: Date, default: Date.now },
}, { timestamps: true });

// --- Models ---
// Check if model exists before compiling to avoid OverwriteModelError in HMR
export const Program: Model<IProgram> = mongoose.models.Program || mongoose.model<IProgram>('Program', ProgramSchema);
export const Session: Model<ISession> = mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);
export const Subject: Model<ISubject> = mongoose.models.Subject || mongoose.model<ISubject>('Subject', SubjectSchema);
export const Batch: Model<IBatch> = mongoose.models.Batch || mongoose.model<IBatch>('Batch', BatchSchema);
export const Assignment: Model<IAssignment> = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
