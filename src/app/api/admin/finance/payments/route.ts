import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeePayment } from '@/models/FeePayment';
import { FeeStructure } from '@/models/FeeStructure';
import '@/models/Academic'; // registers Program & Session for populate()


// GET /api/admin/finance/payments — list all payments with optional filters
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const sessionId = searchParams.get('session');

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (status) query.status = status;

    // If filtering by session, get fee structures for that session first
    if (sessionId) {
        const structures = await FeeStructure.find({ session: sessionId }).select('_id').lean();
        const structureIds = structures.map((s) => s._id);
        query.fee_structure = { $in: structureIds };
    }

    const payments = await FeePayment.find(query)
        .populate('student', 'fullName username email')
        .populate({
            path: 'fee_structure',
            select: 'total_amount semester description due_date',
            populate: [
                { path: 'program', select: 'name code' },
                { path: 'session', select: 'name' },
            ],
        })
        .sort({ updatedAt: -1 })
        .lean();

    return NextResponse.json({ success: true, payments });
}
