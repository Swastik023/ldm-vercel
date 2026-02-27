import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

// GET /api/student/rejection-info — get the current user's rejection reasons
export async function GET(req: NextRequest) {
    const token = await getToken({ req });
    if (!token?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(token.id)
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
}
