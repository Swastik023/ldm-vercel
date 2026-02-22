import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeeRecord } from '@/models/FeeRecord';

// GET /api/student/fees — student sees only their own fee record
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const record = await FeeRecord.findOne({ studentId: session.user.id }).lean();
    if (!record) {
        return NextResponse.json({ success: true, record: null, message: 'No fee record found yet. Please contact the admin.' });
    }
    return NextResponse.json({ success: true, record });
}
