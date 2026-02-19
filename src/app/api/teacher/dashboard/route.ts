import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Assignment } from '@/models/Academic';
import { Attendance } from '@/models/Attendance';
import Notice from '@/models/Notice';
import mongoose from 'mongoose';

// GET /api/teacher/dashboard — real data for the logged-in teacher
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const teacherId = new mongoose.Types.ObjectId(session.user.id);

    // Get all subject assignments for this teacher
    const assignments = await Assignment.find({ teacher: teacherId })
        .populate('subject', 'name code')
        .populate('batch', 'name')
        .populate('session', 'name')
        .lean();

    // Count unique subjects
    const subjectIds = new Set(assignments.map(a => a.subject?._id?.toString()));
    const subjectCount = subjectIds.size;

    // Today's attendance marked by this teacher
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttendance = await Attendance.find({
        teacher: teacherId,
        date: { $gte: todayStart, $lte: todayEnd },
    }).lean();

    let markedToday = 0;
    let presentToday = 0;
    todayAttendance.forEach(record => {
        markedToday += record.records.length;
        presentToday += record.records.filter(r => r.status === 'present').length;
    });

    // Active notices
    const notices = await Notice.find({ isActive: true })
        .select('title createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    // Build class list from assignments (unique per subject+section)
    const classes = assignments.map(a => ({
        id: a._id?.toString(),
        subject_name: (a.subject as any)?.name || 'Unknown Subject',
        subject_code: (a.subject as any)?.code || '',
        batch_name: (a.batch as any)?.name || null,
        section: a.section,
        session_name: (a.session as any)?.name || '',
    }));

    return NextResponse.json({
        success: true,
        profile: {
            id: session.user.id,
            name: session.user.name || '',
            email: session.user.email || '',
        },
        subjectCount,
        classes,
        todayStats: {
            markedToday,
            presentToday,
            sessionsMarked: todayAttendance.length,
        },
        notices: notices.map(n => ({
            id: n._id?.toString(),
            message: n.title,
            createdAt: n.createdAt,
        })),
    });
}
