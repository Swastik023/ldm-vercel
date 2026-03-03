import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Subject } from '@/models/Academic';

// GET /api/admin/academic-options/subjects — all subjects for dropdown
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const subjects = await Subject.find({}).sort({ name: 1 }).lean();
    return NextResponse.json({ success: true, subjects });
}
