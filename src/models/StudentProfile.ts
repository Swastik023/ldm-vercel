import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStudentProfile extends Document {
    userId: mongoose.Types.ObjectId;
    gender: 'Male' | 'Female' | 'Other';
    dateOfBirth: Date;
    mobileNumber: string;
    highestQualification: '10th Pass' | '12th Pass' | 'Graduate' | 'Post Graduate';
    yearOfPassing: number;
    englishComfortLevel: 'Basic' | 'Moderate' | 'Good';
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
        dateOfBirth: { type: Date, required: true },
        mobileNumber: { type: String, required: true },
        highestQualification: {
            type: String,
            enum: ['10th Pass', '12th Pass', 'Graduate', 'Post Graduate'],
            required: true,
        },
        yearOfPassing: { type: Number, required: true },
        englishComfortLevel: {
            type: String,
            enum: ['Basic', 'Moderate', 'Good'],
            required: true,
        },
        emailVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const StudentProfile: Model<IStudentProfile> =
    mongoose.models.StudentProfile ||
    mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
