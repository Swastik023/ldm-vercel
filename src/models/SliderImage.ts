import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISliderImage extends Document {
    url: string;
    publicId: string;        // Cloudinary public_id for deletion
    title: string;
    subtitle?: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SliderImageSchema = new Schema<ISliderImage>(
    {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        title: { type: String, required: true, trim: true },
        subtitle: { type: String, trim: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

SliderImageSchema.index({ order: 1 });

export const SliderImage: Model<ISliderImage> =
    mongoose.models.SliderImage || mongoose.model<ISliderImage>('SliderImage', SliderImageSchema);
