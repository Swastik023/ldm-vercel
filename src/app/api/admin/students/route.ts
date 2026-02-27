import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
// Must import these so Mongoose registers the schemas before populate() runs
import '@/models/Class';
import { Batch } from '@/models/Academic';

// GET /api/admin/students?batchId=&classId=&sessionFrom=&sessionTo=&rollNumber=&page=&limit=
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin') {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const { searchParams } = new URL(req.url);
        const batchId = searchParams.get('batchId');
        const classId = searchParams.get('classId');
        const sessionFrom = searchParams.get('sessionFrom');
        const sessionTo = searchParams.get('sessionTo');
        const rollNumber = searchParams.get('rollNumber');
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'));

        const filter: Record<string, unknown> = { role: 'student' };
        if (batchId) filter.batch = batchId;
        if (classId) filter.classId = classId;
        if (sessionFrom) filter.sessionFrom = parseInt(sessionFrom);
        if (sessionTo) filter.sessionTo = parseInt(sessionTo);
        if (rollNumber) filter.rollNumber = { $regex: rollNumber, $options: 'i' };

        const [students, total] = await Promise.all([
            User.find(filter)
                .populate('batch', 'name')
                .populate('classId', 'className sessionFrom sessionTo')
                .select('fullName email mobileNumber username rollNumber sessionFrom sessionTo isProfileComplete status createdAt batch classId provider rejectionReasons')
                .sort({ sessionFrom: -1, rollNumber: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            User.countDocuments(filter),
        ]);

        return NextResponse.json({
            success: true,
            students,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (err: any) {
        console.error('[admin/students GET]', err);
        return NextResponse.json({ success: false, message: err?.message || 'Internal server error' }, { status: 500 });
    }
}
