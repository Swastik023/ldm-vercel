import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceRecord {
    student: mongoose.Types.ObjectId;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
}

export interface IAttendance extends Document {
    date: Date;
    subject: mongoose.Types.ObjectId;
    teacher: mongoose.Types.ObjectId;
    session: mongoose.Types.ObjectId;
    section: string;
    batch?: mongoose.Types.ObjectId;
    records: IAttendanceRecord[];
    is_locked: boolean;
    marked_at: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
    date: { type: Date, required: true },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
    section: { type: String, required: true },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    records: [{
        student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, enum: ['present', 'absent', 'late', 'excused'], default: 'present' },
        remarks: { type: String }
    }],
    is_locked: { type: Boolean, default: false },
    marked_at: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for quick lookup of attendance by date/subject/section
AttendanceSchema.index({ date: 1, subject: 1, section: 1 }, { unique: true });

export const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
