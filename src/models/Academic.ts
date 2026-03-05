import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Interfaces ---

export interface IProgramPricing {
    totalFee: number;
    paymentType: 'one-time' | 'semester-wise' | 'installments';
    offerPrice: number | null;
    isOfferActive: boolean;
    offerValidUntil: Date | null;
    offerLabel: string;
    seatLimit: number | null;
    currency: string;
    scholarshipAvailable: boolean;
}

export interface ICurriculumUnit {
    unit_no: number;
    title: string;
    content: string;
}

export interface ICurriculumSemester {
    semester: number;
    title: string;
    units: ICurriculumUnit[];
}

export interface ICurriculumProcedure {
    title: string;
    steps: string[];
}

export interface ICurriculumScenario {
    title: string;
    situation: string;
    workflow: string[];
}

export interface ICurriculum {
    overview?: Record<string, string>;
    academic_structure?: {
        duration?: string;
        total_semesters?: number;
        core_competencies?: string[];
        training_framework?: Record<string, string>;
    };
    detailed_syllabus?: ICurriculumSemester[];
    practical_procedures?: ICurriculumProcedure[];
    case_scenarios?: ICurriculumScenario[];
    internship?: {
        duration?: string;
        rotations?: string[];
        objectives?: string[];
    };
    assessment?: Record<string, string>;
    career_pathways?: string[];
    student_engagement?: string[];
    medical_accuracy_verification?: string;
}

export interface IProgram extends Document {
    name: string;
    code: string;
    description?: string;
    duration_years: number;
    total_semesters: number;
    course_type: 'diploma' | 'certificate';
    is_active: boolean;
    // Website display fields
    shortDescription: string;
    image: string;
    eligibilitySummary: string;
    syllabus: string[];
    careerOptions: string[];
    displayOrder: number;
    // Embedded pricing
    pricing: IProgramPricing;
    // Rich curriculum data (optional)
    curriculum?: ICurriculum;
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
    name: string;        // Human-readable, e.g. "CSE_2026_JAN"
    batchCode: string;   // System code, e.g. "CSE_2026_JAN" — unique
    program: mongoose.Types.ObjectId;
    session?: mongoose.Types.ObjectId;  // Optional — batch exists independently of session
    intakeMonth: 'January' | 'July';
    joiningYear: number;
    courseDurationYears: number;
    startDate: Date;
    expectedEndDate: Date;
    actualEndDate?: Date;
    status: 'upcoming' | 'active' | 'completed';
    capacity: number;
    current_students: number;
    current_semester: number;
    is_active: boolean;
}

export interface IAssignment extends Document {
    teacher: mongoose.Types.ObjectId; // Reference to User (Teacher)
    subject: mongoose.Types.ObjectId;
    batch?: mongoose.Types.ObjectId;
    session?: mongoose.Types.ObjectId;
    section: string; // "A", "B", etc.
    assigned_at: Date;
}

// --- Schemas ---

const PricingSubSchema = new Schema({
    totalFee: { type: Number, default: 0, min: 0 },
    paymentType: { type: String, enum: ['one-time', 'semester-wise', 'installments'], default: 'one-time' },
    offerPrice: { type: Number, default: null },
    isOfferActive: { type: Boolean, default: false },
    offerValidUntil: { type: Date, default: null },
    offerLabel: { type: String, default: 'Limited Time Offer', maxlength: 60 },
    seatLimit: { type: Number, default: null },
    currency: { type: String, default: 'INR' },
    scholarshipAvailable: { type: Boolean, default: false },
}, { _id: false });

const CurriculumUnitSubSchema = new Schema({
    unit_no: { type: Number },
    title: { type: String },
    content: { type: String },
}, { _id: false });

const CurriculumSemesterSubSchema = new Schema({
    semester: { type: Number },
    title: { type: String },
    units: [CurriculumUnitSubSchema],
}, { _id: false });

const CurriculumProcedureSubSchema = new Schema({
    title: { type: String },
    steps: [{ type: String }],
}, { _id: false });

const CurriculumScenarioSubSchema = new Schema({
    title: { type: String },
    situation: { type: String },
    workflow: [{ type: String }],
}, { _id: false });

const CurriculumSubSchema = new Schema({
    overview: { type: Schema.Types.Mixed, default: undefined },
    academic_structure: {
        type: new Schema({
            duration: { type: String },
            total_semesters: { type: Number },
            core_competencies: [{ type: String }],
            training_framework: { type: Schema.Types.Mixed },
        }, { _id: false }),
        default: undefined,
    },
    detailed_syllabus: { type: [CurriculumSemesterSubSchema], default: undefined },
    practical_procedures: { type: [CurriculumProcedureSubSchema], default: undefined },
    case_scenarios: { type: [CurriculumScenarioSubSchema], default: undefined },
    internship: {
        type: new Schema({
            duration: { type: String },
            rotations: [{ type: String }],
            objectives: [{ type: String }],
        }, { _id: false }),
        default: undefined,
    },
    assessment: { type: Schema.Types.Mixed, default: undefined },
    career_pathways: { type: [String], default: undefined },
    student_engagement: { type: [String], default: undefined },
    medical_accuracy_verification: { type: String },
}, { _id: false });

const ProgramSchema = new Schema<IProgram>({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    description: { type: String },
    duration_years: { type: Number, required: true },
    total_semesters: { type: Number, required: true },
    course_type: { type: String, enum: ['diploma', 'certificate'], default: 'diploma' },
    is_active: { type: Boolean, default: true },
    // Website display
    shortDescription: { type: String, default: '' },
    image: { type: String, default: '' },
    eligibilitySummary: { type: String, default: '' },
    syllabus: [{ type: String }],
    careerOptions: [{ type: String }],
    displayOrder: { type: Number, default: 0 },
    // Embedded pricing
    pricing: { type: PricingSubSchema, default: () => ({}) },
    // Rich curriculum data (optional)
    curriculum: { type: CurriculumSubSchema, default: undefined },
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
    name: { type: String, required: true, trim: true },
    batchCode: { type: String, required: true, trim: true, uppercase: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    // session is optional — batch exists independently
    session: { type: Schema.Types.ObjectId, ref: 'Session', default: null },
    intakeMonth: { type: String, enum: ['January', 'July'], required: true },
    joiningYear: { type: Number, required: true },
    courseDurationYears: { type: Number, required: true },
    startDate: { type: Date, required: true },
    expectedEndDate: { type: Date, required: true },
    actualEndDate: { type: Date },
    status: { type: String, enum: ['upcoming', 'active', 'completed'], default: 'upcoming' },
    capacity: { type: Number, default: 60 },
    current_students: { type: Number, default: 0 },
    current_semester: { type: Number, default: 1 },
    is_active: { type: Boolean, default: true },
}, { timestamps: true });

// Unique by name (human readable)
BatchSchema.index({ name: 1 }, { unique: true });
// Unique by programme + year + intake — prevents true duplicates even if name differs
BatchSchema.index({ program: 1, joiningYear: 1, intakeMonth: 1 }, { unique: true });

const AssignmentSchema = new Schema<IAssignment>({
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' }, // Optional, maybe assigned to entire section without batch ID?
    session: { type: Schema.Types.ObjectId, ref: 'Session', default: null }, // Optional — not all setups use sessions
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
