import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface ICoursePricing extends Document {
    courseId: string;          // matches courseData[].id
    courseTitle: string;       // for display in admin
    originalPrice: number;     // e.g. 85000
    offerPrice: number;        // e.g. 65000
    isOfferActive: boolean;    // toggle on/off instantly
    offerValidUntil: Date | null; // null = no expiry
    offerLabel: string;        // e.g. "Early Bird", "Limited Seats"
    seatLimit: number | null;  // null = unlimited
    createdAt: Date;
    updatedAt: Date;
}

const CoursePricingSchema = new Schema<ICoursePricing>(
    {
        courseId: { type: String, required: true, unique: true, index: true },
        courseTitle: { type: String, required: true },
        originalPrice: { type: Number, required: true, min: 0 },
        offerPrice: { type: Number, required: true, min: 0 },
        isOfferActive: { type: Boolean, default: false },
        offerValidUntil: { type: Date, default: null },
        offerLabel: { type: String, default: 'Limited Time Offer', maxlength: 60 },
        seatLimit: { type: Number, default: null, min: 1 },
    },
    { timestamps: true }
);

// Auto-expire offer when past date
CoursePricingSchema.virtual('isOfferExpired').get(function (this: ICoursePricing) {
    if (!this.offerValidUntil) return false;
    return new Date() > this.offerValidUntil;
});

CoursePricingSchema.virtual('effectivePrice').get(function (this: ICoursePricing) {
    if (this.isOfferActive && this.offerValidUntil && new Date() <= this.offerValidUntil) {
        return this.offerPrice;
    }
    return this.originalPrice;
});

CoursePricingSchema.virtual('discountPercent').get(function (this: ICoursePricing) {
    if (!this.originalPrice || this.originalPrice === 0) return 0;
    return Math.round(((this.originalPrice - this.offerPrice) / this.originalPrice) * 100);
});

export default models.CoursePricing || model<ICoursePricing>('CoursePricing', CoursePricingSchema);
