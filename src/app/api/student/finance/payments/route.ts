import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeePayment } from '@/models/FeePayment';

// GET /api/student/finance/payments — student views their own fee status
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    await dbConnect();

    const payments = await FeePayment.find({ student: session.user.id })
        .populate({
            path: 'fee_structure',
            select: 'total_amount semester description due_date',
            populate: [
                { path: 'program', select: 'name code' },
                { path: 'session', select: 'name' },
            ],
        })
        .lean();

    const enriched = payments.map((p) => {
        const fs = (p.fee_structure as unknown) as { total_amount: number; due_date: Date } | null;
        const total = fs?.total_amount ?? 0;
        const remaining = total - p.amount_paid;
        const isOverdue = fs?.due_date ? new Date() > new Date(fs.due_date) && p.status !== 'paid' : false;
        return { ...p, remaining, isOverdue };
    });

    return NextResponse.json({ success: true, payments: enriched });
}
