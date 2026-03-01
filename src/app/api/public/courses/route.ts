import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';

// GET /api/public/courses — active courses with pricing for the website
export async function GET() {
    try {
        await dbConnect();
        const now = new Date();
        const programs = await Program.find({ is_active: true })
            .sort({ displayOrder: 1, name: 1 })
            .lean();

        const result = programs.map(p => {
            const pr = p.pricing || {};
            const offerActive = pr.isOfferActive && (!pr.offerValidUntil || new Date(pr.offerValidUntil) > now);
            const effectivePrice = offerActive && pr.offerPrice ? pr.offerPrice : (pr.totalFee || 0);
            const discountPercent = pr.totalFee && pr.totalFee > 0 && pr.offerPrice
                ? Math.round(((pr.totalFee - pr.offerPrice) / pr.totalFee) * 100)
                : 0;

            return {
                _id: p._id,
                id: p.code,           // backward compat with courseData.id
                title: p.name,
                duration: `${p.duration_years} Year${p.duration_years !== 1 ? 's' : ''}`,
                eligibility: p.eligibilitySummary || '',
                image: p.image || '',
                description: p.description || p.shortDescription || '',
                syllabus: p.syllabus || [],
                career: p.careerOptions || [],
                course_type: p.course_type || 'diploma', // default to diploma if not set
                // Pricing
                pricing: {
                    courseId: p.code,
                    originalPrice: pr.totalFee || 0,
                    offerPrice: pr.offerPrice || 0,
                    effectivePrice,
                    offerActive,
                    offerValidUntil: pr.offerValidUntil || null,
                    offerLabel: pr.offerLabel || 'Limited Time Offer',
                    discountPercent,
                    seatLimit: pr.seatLimit || null,
                    paymentType: pr.paymentType || 'one-time',
                    currency: pr.currency || 'INR',
                    scholarshipAvailable: pr.scholarshipAvailable || false,
                },
            };
        });

        return NextResponse.json({ success: true, courses: result });
    } catch (err) {
        console.error('[Public Courses GET]', err);
        return NextResponse.json({ success: false, message: 'Failed to fetch courses.' }, { status: 500 });
    }
}
