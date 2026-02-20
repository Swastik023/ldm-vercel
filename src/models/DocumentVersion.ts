import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDocumentVersion extends Document {
    document_id: mongoose.Types.ObjectId;
    file_path?: string;
    content?: string;
    version_number: number;
    updated_by: mongoose.Types.ObjectId;
    previous_version_reference?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DocumentVersionSchema = new Schema<IDocumentVersion>({
    document_id: { type: Schema.Types.ObjectId, ref: 'LibraryDocument', required: true },
    file_path: { type: String },
    content: { type: String },
    version_number: { type: Number, required: true },
    updated_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    previous_version_reference: { type: Schema.Types.ObjectId, ref: 'DocumentVersion' },
}, { timestamps: true });

export const DocumentVersion: Model<IDocumentVersion> = mongoose.models.DocumentVersion || mongoose.model<IDocumentVersion>('DocumentVersion', DocumentVersionSchema);
