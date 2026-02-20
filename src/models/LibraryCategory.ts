import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILibraryCategory extends Document {
    name: string;
    semester_or_module?: number; // Nullable for common categories
    createdAt: Date;
    updatedAt: Date;
}

const LibraryCategorySchema = new Schema<ILibraryCategory>({
    name: { type: String, required: true },
    semester_or_module: { type: Number },
}, { timestamps: true });

export const LibraryCategory: Model<ILibraryCategory> = mongoose.models.LibraryCategory || mongoose.model<ILibraryCategory>('LibraryCategory', LibraryCategorySchema);
