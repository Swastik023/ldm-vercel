import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILibrary extends Document {
    title: string;
    description?: string;
    url: string; // Cloudinary URL or similar
    public_id?: string; // Cloudinary Public ID
    file_size: number;
    file_type: string; // e.g. 'application/pdf'
    category: string; // 'syllabus', 'paper', 'book'
    uploaded_by: mongoose.Types.ObjectId;
}

const LibrarySchema = new Schema<ILibrary>({
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true },
    public_id: { type: String },
    file_size: { type: Number, default: 0 },
    file_type: { type: String, default: 'application/pdf' },
    category: { type: String, default: 'general' },
    uploaded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Library: Model<ILibrary> = mongoose.models.Library || mongoose.model<ILibrary>('Library', LibrarySchema);
