import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';

// GET /api/public/course-pricing — returns pricing for all active courses (from Program model)
export async function GET() {
    try {
        await dbConnect();
        const now = new Date();
        const programs = await Program.find({ is_active: true }).lean();

        const result = programs.map((p: any) => {
            const pr = p.pricing || {};
            const offerActive = pr.isOfferActive && (!pr.offerValidUntil || new Date(pr.offerValidUntil) > now);
            const effectivePrice = offerActive && pr.offerPrice ? pr.offerPrice : (pr.totalFee || 0);
            const discountPercent = pr.totalFee && pr.totalFee > 0 && pr.offerPrice
                ? Math.round(((pr.totalFee - pr.offerPrice) / pr.totalFee) * 100)
                : 0;

            return {
                courseId: p.code,
                originalPrice: pr.totalFee || 0,
                offerPrice: pr.offerPrice || 0,
                effectivePrice,
                offerActive,
                offerValidUntil: pr.offerValidUntil || null,
                offerLabel: pr.offerLabel || 'Limited Time Offer',
                discountPercent,
                seatLimit: pr.seatLimit || null,
            };
        });

        return NextResponse.json({ success: true, data: result });
    } catch (err) {
        console.error('[CoursePrice Public GET]', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch pricing.' }, { status: 500 });
    }
}
