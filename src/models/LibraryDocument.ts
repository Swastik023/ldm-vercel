import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILibraryDocument extends Document {
    course_id?: mongoose.Types.ObjectId; // Nullable if is_common is true
    category_id: mongoose.Types.ObjectId;
    title: string;
    content?: string; // For rich-text content
    file_path?: string; // For uploaded files
    file_type: 'docx' | 'pptx' | 'xlsx' | 'pdf' | 'rich-text';
    current_version: number;
    is_common: boolean; // If true, linked to all courses
    is_deleted: boolean; // Soft delete
    deleted_by?: mongoose.Types.ObjectId;
    deleted_at?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LibraryDocumentSchema = new Schema<ILibraryDocument>({
    course_id: { type: Schema.Types.ObjectId, ref: 'Program' },
    category_id: { type: Schema.Types.ObjectId, ref: 'LibraryCategory', required: true },
    title: { type: String, required: true },
    content: { type: String },
    file_path: { type: String },
    file_type: {
        type: String,
        enum: ['docx', 'pptx', 'xlsx', 'pdf', 'rich-text'],
        required: true
    },
    current_version: { type: Number, default: 1 },
    is_common: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false },
    deleted_by: { type: Schema.Types.ObjectId, ref: 'User' },
    deleted_at: { type: Date }
}, { timestamps: true });

export const LibraryDocument: Model<ILibraryDocument> = mongoose.models.LibraryDocument || mongoose.model<ILibraryDocument>('LibraryDocument', LibraryDocumentSchema);
