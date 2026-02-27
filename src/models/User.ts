import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    role: 'admin' | 'teacher' | 'student' | 'employee';
    is_root: boolean;
    fullName: string;
    mobileNumber?: string;
    status: 'active' | 'inactive' | 'suspended' | 'pending' | 'under_review' | 'rejected';
    provider: 'credentials' | 'google';
    image?: string;
    isEmailVerified: boolean;
    isProfileComplete: boolean;
    // Legacy academic refs (teacher/attendance system)
    session?: mongoose.Types.ObjectId;
    batch?: mongoose.Types.ObjectId;
    // Student registration fields
    classId?: mongoose.Types.ObjectId;
    rollNumber?: string;
    sessionFrom?: number;
    sessionTo?: number;
    // Admin review — per-field rejection reasons
    rejectionReasons?: Record<string, string>;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    mobileNumber: { type: String },
    provider: { type: String, enum: ['credentials', 'google'], default: 'credentials' },
    image: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isProfileComplete: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'teacher', 'student', 'employee'], default: 'student' },
    is_root: { type: Boolean, default: false },
    fullName: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending', 'under_review', 'rejected'], default: 'pending' },
    // Legacy academic refs (teacher/attendance system)
    session: { type: Schema.Types.ObjectId, ref: 'Session', default: null },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
    // Student registration academic fields
    classId: { type: Schema.Types.ObjectId, ref: 'Class', default: null },
    rollNumber: { type: String, default: null },
    sessionFrom: { type: Number, default: null },
    sessionTo: { type: Number, default: null },
    // Admin review
    rejectionReasons: { type: Schema.Types.Mixed, default: null },
}, { timestamps: true });

// Compound unique index: same roll number cannot exist in the same class
// sparse:true so null classId/rollNumber (teachers, admins) don't collide
UserSchema.index({ classId: 1, rollNumber: 1 }, { unique: true, sparse: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
