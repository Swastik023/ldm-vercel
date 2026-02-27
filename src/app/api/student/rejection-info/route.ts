import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';

// GET /api/student/rejection-info — get the current user's rejection reasons
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();

        const user = await User.findById(session.user.id)
            .select('status rejectionReasons')
            .lean();

        if (!user) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            status: user.status,
            rejectionReasons: user.rejectionReasons || {},
        });
    } catch (err: any) {
        console.error('[student/rejection-info GET]', err);
        return NextResponse.json({ success: false, message: err?.message || 'Internal server error' }, { status: 500 });
    }
}
