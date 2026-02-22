import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Additional File (from file-type custom fields) ---
export interface IAdditionalFile {
    field_id: string;               // Links to ICustomField.field_id
    file_url: string;
    file_name: string;
    file_type: string;
    file_size: number;              // bytes
    cloudinary_public_id: string;
}

const AdditionalFileSchema = new Schema<IAdditionalFile>({
    field_id: { type: String, required: true },
    file_url: { type: String, required: true },
    file_name: { type: String, required: true },
    file_type: { type: String, required: true },
    file_size: { type: Number, required: true },
    cloudinary_public_id: { type: String, required: true }
}, { _id: false });

// --- Submission History Entry ---
export interface ISubmissionHistoryEntry {
    file_url?: string;
    file_name?: string;
    cloudinary_public_id?: string;
    submitted_at: Date;
    status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
    review_comment?: string;
    reviewed_by?: mongoose.Types.ObjectId;
    form_responses?: Record<string, unknown>;
}

// --- Document Submission ---
export interface IDocumentSubmission extends Document {
    requirement: mongoose.Types.ObjectId;
    student: mongoose.Types.ObjectId;
    // Primary file upload (optional if form-only requirement)
    file_url?: string;
    file_name?: string;
    file_type?: string;
    file_size?: number;
    cloudinary_public_id?: string;
    // Dynamic form responses
    form_responses: Map<string, unknown>;       // { field_id → value }
    additional_files: IAdditionalFile[];         // File uploads from custom file fields
    status: 'pending' | 'approved' | 'rejected' | 'resubmitted';
    review: {
        reviewed_by?: mongoose.Types.ObjectId;
        reviewed_at?: Date;
        comment?: string;
    };
    submission_history: ISubmissionHistoryEntry[];
    submitted_at: Date;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentSubmissionSchema = new Schema<IDocumentSubmission>({
    requirement: { type: Schema.Types.ObjectId, ref: 'DocumentRequirement', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Primary file (optional for form-only requirements)
    file_url: { type: String },
    file_name: { type: String },
    file_type: { type: String },
    file_size: { type: Number },
    cloudinary_public_id: { type: String },
    // Dynamic form data
    form_responses: { type: Map, of: Schema.Types.Mixed, default: new Map() },
    additional_files: { type: [AdditionalFileSchema], default: [] },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'resubmitted'],
        default: 'pending'
    },
    review: {
        reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewed_at: { type: Date },
        comment: { type: String }
    },
    submission_history: [{
        file_url: { type: String },
        file_name: { type: String },
        cloudinary_public_id: { type: String },
        submitted_at: { type: Date, required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'resubmitted'],
            required: true
        },
        review_comment: { type: String },
        reviewed_by: { type: Schema.Types.ObjectId, ref: 'User' },
        form_responses: { type: Schema.Types.Mixed }
    }],
    submitted_at: { type: Date, default: Date.now }
}, { timestamps: true });

// One submission per requirement per student
DocumentSubmissionSchema.index({ requirement: 1, student: 1 }, { unique: true });
// Fast lookups for student dashboard
DocumentSubmissionSchema.index({ student: 1, status: 1 });
// Fast lookups for admin/teacher review queue
DocumentSubmissionSchema.index({ status: 1, submitted_at: -1 });

export const DocumentSubmission: Model<IDocumentSubmission> =
    mongoose.models.DocumentSubmission ||
    mongoose.model<IDocumentSubmission>('DocumentSubmission', DocumentSubmissionSchema);
