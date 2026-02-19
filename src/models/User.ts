import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    username: string;
    email: string;
    password?: string;
    role: 'admin' | 'teacher' | 'student' | 'employee';
    fullName: string;
    status: 'active' | 'inactive' | 'suspended';
    // Student-specific fields
    session?: mongoose.Types.ObjectId;
    batch?: mongoose.Types.ObjectId;
    createdAt: Date;
}

const UserSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'teacher', 'student', 'employee'], default: 'student' },
    fullName: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    // Student-specific
    session: { type: Schema.Types.ObjectId, ref: 'Session', default: null },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch', default: null },
}, { timestamps: true });

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
