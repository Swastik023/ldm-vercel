import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMarqueeMessage extends Document {
    message: string;
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const MarqueeMessageSchema: Schema = new Schema(
    {
        message: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const MarqueeMessage: Model<IMarqueeMessage> =
    mongoose.models.MarqueeMessage ||
    mongoose.model<IMarqueeMessage>('MarqueeMessage', MarqueeMessageSchema);

export default MarqueeMessage;
