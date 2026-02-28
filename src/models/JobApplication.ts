import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobApplication extends Document {
    jobId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    resumeUrl: string;
    resumeType: string;           // 'pdf', 'jpg', etc.
    status: 'applied' | 'shortlisted' | 'rejected' | 'selected';
    adminNotes: string;
    appliedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const JobApplicationSchema = new Schema<IJobApplication>({
    jobId: { type: Schema.Types.ObjectId, ref: 'JobPosting', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resumeUrl: { type: String, required: true },
    resumeType: { type: String, required: true },
    status: { type: String, enum: ['applied', 'shortlisted', 'rejected', 'selected'], default: 'applied' },
    adminNotes: { type: String, default: '' },
    appliedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// One application per job per student
JobApplicationSchema.index({ jobId: 1, studentId: 1 }, { unique: true });
JobApplicationSchema.index({ jobId: 1, status: 1 });

export const JobApplication: Model<IJobApplication> =
    mongoose.models.JobApplication || mongoose.model<IJobApplication>('JobApplication', JobApplicationSchema);
