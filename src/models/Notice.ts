import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotice extends Document {
    title: string;
    content: string;
    category: 'general' | 'academic' | 'exam' | 'event' | 'urgent';
    priority: 'low' | 'normal' | 'high';
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    attachmentUrl?: string;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

const NoticeSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        content: { type: String, required: true },
        category: {
            type: String,
            enum: ['general', 'academic', 'exam', 'event', 'urgent'],
            default: 'general',
        },
        priority: {
            type: String,
            enum: ['low', 'normal', 'high'],
            default: 'normal',
        },
        startDate: { type: Date },
        endDate: { type: Date },
        isActive: { type: Boolean, default: true },
        attachmentUrl: { type: String },
        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Prevent overwriting the model if it's already compiled
const Notice: Model<INotice> =
    mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema);

export default Notice;
