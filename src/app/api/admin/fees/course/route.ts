import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudentFee } from '@/models/StudentFee';
import CoursePricing from '@/models/CoursePricing';
import { Batch, Program } from '@/models/Academic';
import '@/models/Academic';
import { User } from '@/models/User';

const round2 = (n: number) => Math.round(n * 100) / 100;

// GET /api/admin/fees/course — list course pricing + how many students are linked
export async function GET(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const pricings = await CoursePricing.find().sort({ courseTitle: 1 }).lean();

        // Count students per courseId that have a corresponding StudentFee record
        const rows = await Promise.all(pricings.map(async (p) => {
            const count = await StudentFee.countDocuments({ courseId: p.courseId });
            const effectivePrice = p.isOfferActive && p.offerValidUntil && new Date() <= new Date(p.offerValidUntil) ? p.offerPrice : p.originalPrice;
            return { ...p, effectivePrice, linkedStudents: count };
        }));

        return NextResponse.json({ success: true, courses: rows });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// PATCH /api/admin/fees/course
// Body: { courseId, newBaseFee }
// → Updates CoursePricing.originalPrice + pushes new baseFee to ALL StudentFee records with that courseId
// → Respects each student's existing discountPct when recalculating finalFee
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await req.json();
        const { courseId, newBaseFee } = body;

        if (!courseId || !newBaseFee || Number(newBaseFee) <= 0)
            return NextResponse.json({ success: false, message: 'courseId and newBaseFee (> 0) are required' }, { status: 400 });

        const base = round2(Number(newBaseFee));

        // Update CoursePricing
        await CoursePricing.findOneAndUpdate({ courseId }, { originalPrice: base });

        // Update all linked StudentFee records
        const fees = await StudentFee.find({ courseId });
        let updatedCount = 0;
        for (const fee of fees) {
            fee.baseFee = base;
            // Respect existing discount %
            fee.finalFee = round2(base - (base * fee.discountPct) / 100);
            await fee.save();
            updatedCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Course fee updated to ₹${base.toLocaleString('en-IN')}. ${updatedCount} student fee records updated.`,
            updatedCount,
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// POST /api/admin/fees/course/assign
// Body: { courseId, batchId?, feeLabel, academicYear, discountPct? }
// → Creates StudentFee records for ALL active students in the batch (or all students with that courseId batch)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const body = await req.json();
        const { courseId, batchId, feeLabel, academicYear, discountPct = 0 } = body;

        if (!courseId || !feeLabel || !academicYear)
            return NextResponse.json({ success: false, message: 'courseId, feeLabel and academicYear are required' }, { status: 400 });

        const pricing = await CoursePricing.findOne({ courseId });
        if (!pricing)
            return NextResponse.json({ success: false, message: `No pricing found for courseId: ${courseId}` }, { status: 404 });

        const baseFee = round2(pricing.isOfferActive && pricing.offerValidUntil && new Date() <= new Date(pricing.offerValidUntil) ? pricing.offerPrice : pricing.originalPrice);
        const pct = Math.min(100, Math.max(0, Number(discountPct)));
        const finalFee = round2(baseFee - (baseFee * pct) / 100);

        // Get all students to assign fees to
        const query: Record<string, unknown> = { role: 'student', status: 'active' };
        if (batchId) query.batch = batchId;

        const students = await User.find(query).select('_id batch').lean();

        let created = 0;
        let skipped = 0;
        for (const student of students) {
            // Skip if already has a fee for this courseId + academicYear
            const exists = await StudentFee.findOne({ studentId: student._id, courseId, academicYear });
            if (exists) { skipped++; continue; }

            await StudentFee.create({
                studentId: student._id,
                batchId: student.batch || batchId,
                courseId,
                feeLabel,
                academicYear,
                baseFee,
                discountPct: pct,
                finalFee,
                amountPaid: 0,
            });
            created++;
        }

        return NextResponse.json({
            success: true,
            message: `Fee assigned to ${created} students (${skipped} already had a record).`,
            created,
            skipped,
        }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}
