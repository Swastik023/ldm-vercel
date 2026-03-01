import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { StudentFee } from '@/models/StudentFee';

// GET /api/student/fees — student sees only their own fee records
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const fees = await StudentFee.find({ studentId: session.user.id }).sort({ createdAt: -1 }).lean();
    // Add virtual amountRemaining
    const records = fees.map(f => ({
        ...f,
        amountRemaining: Math.max(0, f.finalFee - f.amountPaid),
    }));
    return NextResponse.json({ success: true, fees: records, record: records[0] || null });
}

