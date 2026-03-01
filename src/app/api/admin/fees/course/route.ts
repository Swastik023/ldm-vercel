import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudentFee } from '@/models/StudentFee';
import { Program } from '@/models/Academic';
import { User } from '@/models/User';
import { round2 } from '@/lib/math';

// GET /api/admin/fees/course — list all Programs with their embedded pricing + student fee counts
export async function GET(_req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const programs = await Program.find({}).sort({ displayOrder: 1, name: 1 }).lean();

        const rows = await Promise.all(programs.map(async (p: any) => {
            const pr = p.pricing || {};
            const now = new Date();
            const offerActive = pr.isOfferActive && (!pr.offerValidUntil || new Date(pr.offerValidUntil) > now);
            const effectivePrice = offerActive && pr.offerPrice ? pr.offerPrice : (pr.totalFee || 0);

            // Count students with StudentFee records for this program
            const count = await StudentFee.countDocuments({ courseId: p.code });

            return {
                _id: p._id.toString(),
                courseId: p.code,
                courseTitle: p.name,
                originalPrice: pr.totalFee || 0,
                offerPrice: pr.offerPrice || 0,
                isOfferActive: offerActive,
                effectivePrice,
                linkedStudents: count,
                is_active: p.is_active,
                course_type: p.course_type,
            };
        }));

        return NextResponse.json({ success: true, courses: rows });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}

// PATCH /api/admin/fees/course
// Body: { courseId (code), newBaseFee }
// → Updates Program.pricing.totalFee + pushes new baseFee to ALL StudentFee records
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

        // Update Program pricing
        await Program.findOneAndUpdate(
            { code: courseId },
            { 'pricing.totalFee': base }
        );

        // Update all linked StudentFee records
        const fees = await StudentFee.find({ courseId });
        let updatedCount = 0;
        for (const fee of fees) {
            fee.baseFee = base;
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

// POST /api/admin/fees/course
// Body: { courseId, batchId?, feeLabel, academicYear, discountPct? }
// → Creates StudentFee records for all active students
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

        // Look up pricing from Program
        const program = await Program.findOne({ code: courseId }).lean() as any;
        if (!program)
            return NextResponse.json({ success: false, message: `No program found for courseId: ${courseId}` }, { status: 404 });

        const pr = program.pricing || {};
        const now = new Date();
        const offerActive = pr.isOfferActive && (!pr.offerValidUntil || new Date(pr.offerValidUntil) > now);
        const baseFee = round2(offerActive && pr.offerPrice ? pr.offerPrice : (pr.totalFee || 0));

        if (baseFee <= 0)
            return NextResponse.json({ success: false, message: 'Cannot assign fees — no pricing configured for this course.' }, { status: 400 });

        const pct = Math.min(100, Math.max(0, Number(discountPct)));
        const finalFee = round2(baseFee - (baseFee * pct) / 100);

        const query: Record<string, unknown> = { role: 'student', status: 'active' };
        if (batchId) query.batch = batchId;

        const students = await User.find(query).select('_id batch').lean();

        let created = 0;
        let skipped = 0;
        for (const student of students) {
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
