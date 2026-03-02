import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import '@/models/Academic';

// GET /api/student/attendance — student sees their detailed attendance records + calendar data + open sessions
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const studentId = new mongoose.Types.ObjectId(session.user.id);

    // Find the student to get their batch
    const student = await User.findById(studentId).select('batch').lean();

    // Find all attendance documents where this student appears in records
    const docs = await Attendance.find({ 'records.student': studentId })
        .populate('subject', 'name code')
        .populate('teacher', 'fullName')
        .sort({ date: -1 })
        .lean();

    // Extract this student's record from each attendance document
    const records = docs.map(doc => {
        const myRecord = doc.records.find(
            r => r.student.toString() === session.user.id
        );
        return {
            date: doc.date,
            subject: doc.subject,
            teacher: doc.teacher,
            section: doc.section,
            status: myRecord?.status || 'absent',
            marked_by: myRecord?.marked_by || 'teacher',
            remarks: myRecord?.remarks || '',
        };
    });

    // Calculate summary stats
    let present = 0, absent = 0, late = 0, excused = 0;
    records.forEach(r => {
        if (r.status === 'present') present++;
        else if (r.status === 'absent') absent++;
        else if (r.status === 'late') late++;
        else if (r.status === 'excused') excused++;
    });

    const total = records.length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    // ── Calendar data: group records by date ─────────────────────────
    const calendarMap: Record<string, { classes: Array<{ subject: string; code: string; teacher: string; status: string }> }> = {};
    for (const r of records) {
        const dateKey = new Date(r.date).toISOString().split('T')[0];
        if (!calendarMap[dateKey]) {
            calendarMap[dateKey] = { classes: [] };
        }
        calendarMap[dateKey].classes.push({
            subject: (r.subject as any)?.name || 'N/A',
            code: (r.subject as any)?.code || '',
            teacher: (r.teacher as any)?.fullName || 'N/A',
            status: r.status,
        });
    }

    // ── Open self-mark sessions for this student's batch ─────────────
    const now = new Date();
    const openSessionQuery: any = {
        self_mark_open: true,
        self_mark_deadline: { $gt: now },
        status: { $ne: 'finalized' },
    };
    if (student?.batch) {
        openSessionQuery.batch = student.batch;
    }

    const openSessions = await Attendance.find(openSessionQuery)
        .populate('subject', 'name code')
        .populate('teacher', 'fullName')
        .lean();

    // Filter: only sessions where the student hasn't already marked
    const selfMarkSessions = openSessions
        .filter(s => !s.records.some((r: any) => r.student.toString() === session.user.id))
        .map(s => ({
            _id: s._id?.toString(),
            subject: (s.subject as any)?.name || 'N/A',
            subject_code: (s.subject as any)?.code || '',
            teacher: (s.teacher as any)?.fullName || 'N/A',
            deadline: s.self_mark_deadline,
            section: s.section,
        }));

    return NextResponse.json({
        success: true,
        records,
        summary: { present, absent, late, excused, total, percentage },
        calendar: calendarMap,
        open_sessions: selfMarkSessions,
    });
}
