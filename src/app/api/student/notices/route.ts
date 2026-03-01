import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Notice from '@/models/Notice';

// GET /api/student/notices — student sees active notices
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    const notices = await Notice.find({
        isActive: true,
        $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
        ],
    })
        .select('title content category priority startDate endDate attachmentUrl attachmentName file_type createdAt')
        .sort({ priority: -1, createdAt: -1 })
        .limit(50)
        .lean();

    return NextResponse.json({ success: true, notices });
}
