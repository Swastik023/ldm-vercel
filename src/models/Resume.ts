import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEducationEntry {
    qualification: string;
    institution: string;
    yearOfPassing: number;
    percentage?: string;
}

export interface IInternship {
    hasInternship: boolean;
    hospitalName?: string;
    duration?: string;
    role?: string;
}

export interface IExperience {
    isFresher: boolean;
    jobRole?: string;
    organization?: string;
    duration?: string;
    responsibilities?: string[];
}

export interface IResume extends Document {
    userId: mongoose.Types.ObjectId;
    address: {
        state: string;
        district: string;
        customText?: string;
    };
    careerObjective: string;
    education: IEducationEntry[];
    skills: string[];
    internship: IInternship;
    experience: IExperience;
    languages: string[];
    createdAt: Date;
    updatedAt: Date;
}

const EducationSchema = new Schema<IEducationEntry>(
    {
        qualification: { type: String, required: true },
        institution: { type: String, required: true },
        yearOfPassing: { type: Number, required: true },
        percentage: { type: String },
    },
    { _id: false }
);

const ResumeSchema = new Schema<IResume>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        address: {
            state: { type: String, default: '' },
            district: { type: String, default: '' },
            customText: { type: String, default: '' },
        },
        careerObjective: { type: String, default: '' },
        education: { type: [EducationSchema], default: [] },
        skills: { type: [String], default: [] },
        internship: {
            hasInternship: { type: Boolean, default: false },
            hospitalName: { type: String },
            duration: { type: String },
            role: { type: String },
        },
        experience: {
            isFresher: { type: Boolean, default: true },
            jobRole: { type: String },
            organization: { type: String },
            duration: { type: String },
            responsibilities: { type: [String], default: [] },
        },
        languages: { type: [String], default: [] },
    },
    { timestamps: true }
);

export const Resume: Model<IResume> =
    mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
