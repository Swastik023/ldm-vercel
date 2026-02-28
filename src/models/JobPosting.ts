import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobEligibility {
    programs: mongoose.Types.ObjectId[];  // Allowed programs (empty = all)
    graduationYears: number[];            // e.g. [2025, 2026]
    min10thPct: number;                   // Minimum 10th percentage
    min12thPct: number;                   // Minimum 12th percentage
}

export interface IJobReferralConfig {
    enabled: boolean;
    maxPerStudent: number;
    reward: string;  // e.g. "₹5,000 on successful hire"
}

export interface IJobPosting extends Document {
    title: string;
    company: string;
    jobType: 'fulltime' | 'internship';
    location: 'remote' | 'onsite' | 'hybrid';
    ctc: string;                          // Free text: "₹6 LPA" or "₹15K/month"
    description: string;
    skillsRequired: string[];
    deadline: Date;
    status: 'draft' | 'published' | 'closed';
    createdBy: mongoose.Types.ObjectId;
    eligibility: IJobEligibility;
    referral: IJobReferralConfig;
    createdAt: Date;
    updatedAt: Date;
}

const JobEligibilitySchema = new Schema<IJobEligibility>({
    programs: [{ type: Schema.Types.ObjectId, ref: 'Program' }],
    graduationYears: [{ type: Number }],
    min10thPct: { type: Number, default: 0, min: 0, max: 100 },
    min12thPct: { type: Number, default: 0, min: 0, max: 100 },
}, { _id: false });

const JobReferralConfigSchema = new Schema<IJobReferralConfig>({
    enabled: { type: Boolean, default: false },
    maxPerStudent: { type: Number, default: 3, min: 1 },
    reward: { type: String, default: '' },
}, { _id: false });

const JobPostingSchema = new Schema<IJobPosting>({
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    jobType: { type: String, enum: ['fulltime', 'internship'], required: true },
    location: { type: String, enum: ['remote', 'onsite', 'hybrid'], required: true },
    ctc: { type: String, required: true },
    description: { type: String, required: true },
    skillsRequired: [{ type: String, trim: true }],
    deadline: { type: Date, required: true },
    status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    eligibility: { type: JobEligibilitySchema, default: () => ({ programs: [], graduationYears: [], min10thPct: 0, min12thPct: 0 }) },
    referral: { type: JobReferralConfigSchema, default: () => ({ enabled: false, maxPerStudent: 3, reward: '' }) },
}, { timestamps: true });

JobPostingSchema.index({ status: 1, deadline: 1 });
JobPostingSchema.index({ createdBy: 1 });

export const JobPosting: Model<IJobPosting> =
    mongoose.models.JobPosting || mongoose.model<IJobPosting>('JobPosting', JobPostingSchema);
