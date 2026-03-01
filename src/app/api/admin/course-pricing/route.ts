import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Program } from '@/models/Academic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function adminOnly(session: any) {
    if (!session || session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    return null;
}

// GET /api/admin/course-pricing — all programs with their embedded pricing
export async function GET() {
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    await dbConnect();
    const programs = await Program.find({}).sort({ displayOrder: 1, name: 1 }).lean();
    const now = new Date();

    const result = programs.map((p: any) => {
        const pr = p.pricing || {};
        const offerActive = pr.isOfferActive && (!pr.offerValidUntil || new Date(pr.offerValidUntil) > now);
        return {
            courseId: p.code,
            courseTitle: p.name,
            originalPrice: pr.totalFee ?? null,
            offerPrice: pr.offerPrice ?? null,
            isOfferActive: offerActive,
            offerValidUntil: pr.offerValidUntil ?? null,
            offerLabel: pr.offerLabel ?? 'Limited Time Offer',
            seatLimit: pr.seatLimit ?? null,
            hasPricing: !!(pr.totalFee && pr.totalFee > 0),
            _id: p._id,
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
    if (Number(offerPrice) > Number(originalPrice)) {
        return NextResponse.json({ success: false, message: 'Offer price cannot exceed original price.' }, { status: 400 });
    }

    await dbConnect();
    const program = await Program.findOne({ code: courseId });
    if (!program) return NextResponse.json({ success: false, message: 'Invalid courseId — program not found.' }, { status: 400 });

    // Update the embedded pricing sub-document
    program.pricing = {
        ...program.pricing,
        totalFee: Number(originalPrice),
        offerPrice: Number(offerPrice),
        isOfferActive: Boolean(isOfferActive),
        offerValidUntil: offerValidUntil ? new Date(offerValidUntil) : null,
        offerLabel: offerLabel || 'Limited Time Offer',
        seatLimit: seatLimit ? Number(seatLimit) : null,
    };
    await program.save();

    return NextResponse.json({ success: true, data: program }, { status: 200 });
}

// DELETE /api/admin/course-pricing?courseId=xxx — reset pricing for a course
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    const deny = adminOnly(session);
    if (deny) return deny;

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) return NextResponse.json({ success: false, message: 'courseId required' }, { status: 400 });

    await dbConnect();
    await Program.findOneAndUpdate({ code: courseId }, {
        'pricing.totalFee': 0,
        'pricing.offerPrice': null,
        'pricing.isOfferActive': false,
        'pricing.offerValidUntil': null,
        'pricing.offerLabel': 'Limited Time Offer',
        'pricing.seatLimit': null,
    });

    return NextResponse.json({ success: true, message: 'Pricing reset.' });
}
