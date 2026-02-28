import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobReferral extends Document {
    jobId: mongoose.Types.ObjectId;
    referredBy: mongoose.Types.ObjectId;   // Student who referred
    candidateName: string;
    candidateEmail: string;
    candidatePhone: string;
    resumeUrl: string;
    resumeType: string;
    status: 'referred' | 'shortlisted' | 'rejected' | 'hired';
    rewardApproved: boolean;
    adminNotes: string;
    createdAt: Date;
    updatedAt: Date;
}

const JobReferralSchema = new Schema<IJobReferral>({
    jobId: { type: Schema.Types.ObjectId, ref: 'JobPosting', required: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, trim: true, lowercase: true },
    candidatePhone: { type: String, required: true },
    resumeUrl: { type: String, required: true },
    resumeType: { type: String, required: true },
    status: { type: String, enum: ['referred', 'shortlisted', 'rejected', 'hired'], default: 'referred' },
    rewardApproved: { type: Boolean, default: false },
    adminNotes: { type: String, default: '' },
}, { timestamps: true });

// Unique candidate email per job
JobReferralSchema.index({ jobId: 1, candidateEmail: 1 }, { unique: true });
JobReferralSchema.index({ jobId: 1, referredBy: 1 });

export const JobReferral: Model<IJobReferral> =
    mongoose.models.JobReferral || mongoose.model<IJobReferral>('JobReferral', JobReferralSchema);
