import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import CoursePricing from '@/models/CoursePricing';

// GET /api/public/course-pricing  — returns all active pricing (used by course pages)
export async function GET() {
    try {
        await dbConnect();
        const now = new Date();
        const pricings = await CoursePricing.find({}).lean();

        // Compute effective values before sending to client
        const result = pricings.map(p => {
            const offerActive = p.isOfferActive && (!p.offerValidUntil || new Date(p.offerValidUntil) > now);
            const effectivePrice = offerActive ? p.offerPrice : p.originalPrice;
            const discountPercent = p.originalPrice > 0
                ? Math.round(((p.originalPrice - p.offerPrice) / p.originalPrice) * 100)
                : 0;
            return {
                courseId: p.courseId,
                originalPrice: p.originalPrice,
                offerPrice: p.offerPrice,
                effectivePrice,
                offerActive,
                offerValidUntil: p.offerValidUntil,
                offerLabel: p.offerLabel,
                discountPercent,
                seatLimit: p.seatLimit,
            };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        console.error('[CoursePrice Public GET]', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch pricing.' }, { status: 500 });
    }
}
