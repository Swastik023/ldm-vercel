import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmailOTP extends Document {
    email: string;
    hashedOTP: string;
    expiresAt: Date;
    attempts: number;
    lastSentAt: Date;
    verified: boolean;
}

const EmailOTPSchema = new Schema<IEmailOTP>({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    hashedOTP: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
});

// Auto-delete expired OTP documents (MongoDB TTL index)
EmailOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailOTP: Model<IEmailOTP> =
    mongoose.models.EmailOTP ||
    mongoose.model<IEmailOTP>('EmailOTP', EmailOTPSchema);
