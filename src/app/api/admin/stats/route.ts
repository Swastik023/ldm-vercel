import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import Notice from '@/models/Notice';
import Contact from '@/models/Contact';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/admin/stats - real dashboard stats from DB
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [totalUsers, students, teachers, employees, activeNotices, unreadMessages] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        User.countDocuments({ role: 'employee' }),
        Notice.countDocuments({ isActive: true }),
        Contact.countDocuments({ status: 'unread' }),
    ]);

    return NextResponse.json({
        success: true,
        stats: {
            totalUsers,
            students,
            teachers,
            employees,
            activeNotices,
            unreadMessages,
        },
    });
}
