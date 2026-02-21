import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import CoursePricing from '@/models/CoursePricing';
import { courseData } from '@/data/courseData';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminOnly(session: any) {
    if (!session || session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

// GET /api/admin/course-pricing — all courses with their pricing (or defaults)
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    await dbConnect();
    const pricings = await CoursePricing.find({}).lean();
    const pricingMap = Object.fromEntries(pricings.map(p => [p.courseId, p]));

    // Merge with courseData so admin sees every course even without pricing set
    const result = courseData.map(c => {
        const p = pricingMap[c.id];
        return {
            courseId: c.id,
            courseTitle: c.title,
            originalPrice: p?.originalPrice ?? null,
            offerPrice: p?.offerPrice ?? null,
            isOfferActive: p?.isOfferActive ?? false,
            offerValidUntil: p?.offerValidUntil ?? null,
            offerLabel: p?.offerLabel ?? 'Limited Time Offer',
            seatLimit: p?.seatLimit ?? null,
            hasPricing: !!p,
            _id: p?._id ?? null,
        };
    });

    return NextResponse.json({ success: true, data: result });
}

// POST /api/admin/course-pricing — upsert pricing for a course
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ success: false, message: 'Invalid body' }, { status: 400 });

    const { courseId, originalPrice, offerPrice, isOfferActive, offerValidUntil, offerLabel, seatLimit } = body;

    if (!courseId || originalPrice == null || offerPrice == null) {
        return NextResponse.json({ success: false, message: 'courseId, originalPrice, offerPrice required.' }, { status: 400 });
    }
    if (offerPrice > originalPrice) {
        return NextResponse.json({ success: false, message: 'Offer price cannot exceed original price.' }, { status: 400 });
    }

    const course = courseData.find(c => c.id === courseId);
    if (!course) return NextResponse.json({ success: false, message: 'Invalid courseId.' }, { status: 400 });

    await dbConnect();
    const doc = await CoursePricing.findOneAndUpdate(
        { courseId },
        {
            courseTitle: course.title,
            originalPrice: Number(originalPrice),
            offerPrice: Number(offerPrice),
            isOfferActive: Boolean(isOfferActive),
            offerValidUntil: offerValidUntil ? new Date(offerValidUntil) : null,
            offerLabel: offerLabel || 'Limited Time Offer',
            seatLimit: seatLimit ? Number(seatLimit) : null,
        },
        { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: doc }, { status: 200 });
}

// DELETE /api/admin/course-pricing?courseId=xxx — remove pricing for a course
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) return NextResponse.json({ success: false, message: 'courseId required' }, { status: 400 });

    await dbConnect();
    await CoursePricing.deleteOne({ courseId });
    return NextResponse.json({ success: true, message: 'Pricing removed.' });
}
