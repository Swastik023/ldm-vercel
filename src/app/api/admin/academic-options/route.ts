import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Session, Batch, Program } from '@/models/Academic';
import '@/models/Academic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/academic-options — returns sessions and batches for dropdowns
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'teacher'].includes(session.user?.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [sessions, batches] = await Promise.all([
        Session.find({}).sort({ start_date: -1 }).lean(),
        Batch.find({ is_active: true })
            .populate('program', 'name code')
            .populate('session', 'name')
            .sort({ name: 1 })
            .lean(),
    ]);

    return NextResponse.json({ success: true, sessions, batches });
}
