import mongoose, { Schema, Document, Model } from 'mongoose';

export type NoticeFileType = 'none' | 'rich-text' | 'md' | 'pdf' | 'docx' | 'pptx' | 'xlsx';

export interface INotice extends Document {
    title: string;
    content: string;
    category: 'general' | 'academic' | 'exam' | 'event' | 'urgent';
    priority: 'low' | 'normal' | 'high';
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    // Legacy single attachment (kept for backward-compat)
    attachmentUrl?: string;
    attachmentName?: string;
    // New multi-format fields
    file_type: NoticeFileType;
    attachment_content?: string; // for rich-text or md content stored inline
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
        // Legacy
        attachmentUrl: { type: String },
        attachmentName: { type: String },
        // New
        file_type: { type: String, enum: ['none', 'rich-text', 'md', 'pdf', 'docx', 'pptx', 'xlsx'], default: 'none' },
        attachment_content: { type: String }, // stores inline rich-text/md content
        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const Notice: Model<INotice> =
    mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema);

export default Notice;
