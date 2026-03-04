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

    const [totalUsers, students, teachers, employees, activeNotices, unreadMessages, pendingStudents, rejectedStudents] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'teacher' }),
        User.countDocuments({ role: 'employee' }),
        Notice.countDocuments({ isActive: true }),
        Contact.countDocuments({ status: 'unread' }),
        User.countDocuments({ role: 'student', status: { $in: ['pending', 'under_review'] } }),
        User.countDocuments({ role: 'student', status: 'rejected' }),
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
            pendingStudents,
            rejectedStudents,
        },
    });
}
