import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Custom Field Definition ---
export interface ICustomField {
    field_id: string;           // UUID key for form_responses mapping
    label: string;              // e.g. "Roll Number", "Date of Birth"
    field_type: 'text' | 'textarea' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'file';
    is_required: boolean;
    placeholder?: string;
    options?: string[];         // For dropdown fields
    max_length?: number;        // For text/textarea
    allowed_file_types?: string[];  // For file-type custom fields
    max_file_size_mb?: number;      // For file-type custom fields
    order: number;              // Display order
}

const CustomFieldSchema = new Schema<ICustomField>({
    field_id: { type: String, required: true },
    label: { type: String, required: true, trim: true },
    field_type: {
        type: String,
        enum: ['text', 'textarea', 'number', 'date', 'dropdown', 'checkbox', 'file'],
        required: true
    },
    is_required: { type: Boolean, default: false },
    placeholder: { type: String, trim: true },
    options: [{ type: String }],
    max_length: { type: Number },
    allowed_file_types: [{ type: String }],
    max_file_size_mb: { type: Number },
    order: { type: Number, default: 0 }
}, { _id: false });

// --- Document Requirement ---
export interface IDocumentRequirement extends Document {
    title: string;
    description?: string;
    category: 'personal_document' | 'academic' | 'assignment' | 'certificate';
    required_file_types: string[];
    max_file_size_mb: number;
    is_mandatory: boolean;
    due_date?: Date;
    scope: {
        type: 'all' | 'program' | 'batch' | 'student';
        program?: mongoose.Types.ObjectId;
        batch?: mongoose.Types.ObjectId;
        students?: mongoose.Types.ObjectId[];
    };
    subject?: mongoose.Types.ObjectId;
    created_by: mongoose.Types.ObjectId;
    is_active: boolean;
    custom_fields: ICustomField[];
    requires_file_upload: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentRequirementSchema = new Schema<IDocumentRequirement>({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: {
        type: String,
        enum: ['personal_document', 'academic', 'assignment', 'certificate'],
        required: true
    },
    required_file_types: {
        type: [String],
        default: ['pdf', 'jpg', 'png']
    },
    max_file_size_mb: { type: Number, default: 5, min: 1, max: 25 },
    is_mandatory: { type: Boolean, default: true },
    due_date: { type: Date },
    scope: {
        type: {
            type: String,
            enum: ['all', 'program', 'batch', 'student'],
            required: true,
            default: 'all'
        },
        program: { type: Schema.Types.ObjectId, ref: 'Program' },
        batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
        students: [{ type: Schema.Types.ObjectId, ref: 'User' }]
    },
    subject: { type: Schema.Types.ObjectId, ref: 'Subject' },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    is_active: { type: Boolean, default: true },
    custom_fields: { type: [CustomFieldSchema], default: [] },
    requires_file_upload: { type: Boolean, default: true }
}, { timestamps: true });

// Indexes for efficient querying
DocumentRequirementSchema.index({ category: 1, is_active: 1 });
DocumentRequirementSchema.index({ 'scope.type': 1 });
DocumentRequirementSchema.index({ 'scope.program': 1 });
DocumentRequirementSchema.index({ 'scope.batch': 1 });
DocumentRequirementSchema.index({ created_by: 1 });

export const DocumentRequirement: Model<IDocumentRequirement> =
    mongoose.models.DocumentRequirement ||
    mongoose.model<IDocumentRequirement>('DocumentRequirement', DocumentRequirementSchema);
