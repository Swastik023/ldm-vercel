import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGallery extends Document {
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    category: string;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const GallerySchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        imageUrl: { type: String, required: true },
        thumbnailUrl: { type: String },
        category: { type: String, default: 'general' },
        displayOrder: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Gallery: Model<IGallery> =
    mongoose.models.Gallery || mongoose.model<IGallery>('Gallery', GallerySchema);

export default Gallery;
