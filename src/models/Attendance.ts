import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceRecord {
    student: mongoose.Types.ObjectId;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
    marked_by?: 'teacher' | 'self' | 'admin';
}

export interface IAttendance extends Document {
    date: Date;
    subject: mongoose.Types.ObjectId;
    teacher: mongoose.Types.ObjectId;
    session?: mongoose.Types.ObjectId;   // Optional — assignments may not have a session
    section?: string;
    batch?: mongoose.Types.ObjectId;
    records: IAttendanceRecord[];
    is_locked: boolean;
    marked_at: Date;
    status: 'open' | 'reviewing' | 'finalized';
    self_mark_open: boolean;
    self_mark_deadline?: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
    date: { type: Date, required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session' },       // Optional
    section: { type: String, default: '' },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    records: [{
        student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
        remarks: { type: String },
        marked_by: { type: String, enum: ['teacher', 'self', 'admin'], default: 'teacher' }
    }],
    is_locked: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'reviewing', 'finalized'], default: 'open' },
    self_mark_open: { type: Boolean, default: false },
    self_mark_deadline: { type: Date },
    marked_at: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for quick lookup of attendance by date/subject/batch
AttendanceSchema.index({ date: 1, subject: 1, batch: 1 }, { unique: true });
// Fast student-specific attendance lookups (student dashboard)
AttendanceSchema.index({ 'records.student': 1, date: -1 });

export const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
