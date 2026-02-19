import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Assignment } from '@/models/Academic';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import mongoose from 'mongoose';

// GET /api/teacher/attendance/[assignmentId] — fetch students for this assignment
export async function GET(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { assignmentId } = await params;

    // Load assignment to get batch/session info
    const assignment = await Assignment.findById(assignmentId)
        .populate('subject', 'name code')
        .populate('batch', 'name')
        .populate('session', 'name')
        .lean();

    if (!assignment) {
        return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });
    }

    // Find students in this batch (students with role=student and matching batch)
    let studentQuery: any = { role: 'student', status: 'active' };
    if (assignment.batch) {
        studentQuery.batch = assignment.batch._id || assignment.batch;
    }

    const students = await User.find(studentQuery)
        .select('fullName username _id')
        .sort({ fullName: 1 })
        .lean();

    return NextResponse.json({
        success: true,
        assignment: {
            id: assignment._id?.toString(),
            subject_name: (assignment.subject as any)?.name || '',
            subject_code: (assignment.subject as any)?.code || '',
            batch_name: (assignment.batch as any)?.name || null,
            section: assignment.section,
            session_name: (assignment.session as any)?.name || '',
        },
        students: students.map(s => ({
            _id: s._id?.toString(),
            fullName: s.fullName,
            username: s.username,
        })),
    });
}

// POST /api/teacher/attendance/[assignmentId] — save attendance records
export async function POST(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const [{ assignmentId }, { date, records }] = await Promise.all([params, request.json()]);
    // records: Array<{ studentId: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }>

    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
        return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const formattedRecords = records.map((r: any) => ({
        student: new mongoose.Types.ObjectId(r.studentId),
        status: r.status,
        remarks: r.remarks || '',
    }));

    // Upsert: update if already exists for this date/subject/section
    await Attendance.findOneAndUpdate(
        {
            date: attendanceDate,
            subject: assignment.subject,
            section: assignment.section,
        },
        {
            date: attendanceDate,
            subject: assignment.subject,
            teacher: new mongoose.Types.ObjectId(session.user.id),
            session: assignment.session,
            section: assignment.section,
            batch: assignment.batch || undefined,
            records: formattedRecords,
            marked_at: new Date(),
        },
        { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: 'Attendance saved' });
}
