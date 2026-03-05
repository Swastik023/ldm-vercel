import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Assignment } from '@/models/Academic';
import '@/models/Academic';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import mongoose from 'mongoose';

// PATCH /api/teacher/attendance/[assignmentId]/session
// Body: { action: 'open_self_mark' | 'close_self_mark' | 'review' | 'finalize', durationMinutes?: number }
export async function PATCH(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { assignmentId } = await params;
    const { action, durationMinutes = 30, date } = await request.json();

    const assignment = await Assignment.findOne({
        _id: assignmentId,
        teacher: session.user.id,
    }).lean();
    if (!assignment) {
        return NextResponse.json({ success: false, message: 'Assignment not found or not assigned to you' }, { status: 404 });
    }

    const attendanceDate = new Date(date || new Date().toISOString().split('T')[0]);
    attendanceDate.setHours(0, 0, 0, 0);

    // Find or create the attendance document
    let attendance = await Attendance.findOne({
        date: attendanceDate,
        subject: assignment.subject,
        batch: (assignment as any).batch || undefined,
    });

    if (!attendance) {
        attendance = await Attendance.create({
            date: attendanceDate,
            subject: assignment.subject,
            teacher: new mongoose.Types.ObjectId(session.user.id),
            ...((assignment as any).session ? { session: (assignment as any).session } : {}),
            batch: (assignment as any).batch || undefined,
            records: [],
            status: 'open',
        });
    }

    if (attendance.status === 'finalized' && action !== 'reopen') {
        return NextResponse.json({ success: false, message: 'Session is already finalized' }, { status: 400 });
    }

    switch (action) {
        case 'open_self_mark': {
            const deadline = new Date();
            deadline.setMinutes(deadline.getMinutes() + durationMinutes);
            attendance.self_mark_open = true;
            attendance.self_mark_deadline = deadline;
            attendance.status = 'open';
            break;
        }
        case 'close_self_mark': {
            attendance.self_mark_open = false;
            break;
        }
        case 'review': {
            attendance.self_mark_open = false;
            attendance.status = 'reviewing';
            break;
        }
        case 'finalize': {
            attendance.self_mark_open = false;
            attendance.status = 'finalized';
            attendance.is_locked = true;

            // Auto-mark unmarked students as absent
            const studentQuery: any = { role: 'student', status: 'active' };
            if (assignment.batch) {
                studentQuery.batch = assignment.batch;
            }
            const allStudents = await User.find(studentQuery).select('_id').lean();
            const markedIds = new Set(attendance.records.map((r: any) => r.student.toString()));

            for (const stu of allStudents) {
                if (!markedIds.has(stu._id!.toString())) {
                    attendance.records.push({
                        student: stu._id as mongoose.Types.ObjectId,
                        status: 'absent',
                        marked_by: 'teacher',
                        remarks: 'Auto-marked absent on finalize',
                    } as any);
                }
            }
            break;
        }
        default:
            return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

    await attendance.save();

    return NextResponse.json({
        success: true,
        status: attendance.status,
        self_mark_open: attendance.self_mark_open,
        self_mark_deadline: attendance.self_mark_deadline,
        records_count: attendance.records.length,
    });
}

// GET /api/teacher/attendance/[assignmentId]/session?date=YYYY-MM-DD
export async function GET(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'teacher') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { assignmentId } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const assignment = await Assignment.findOne({
        _id: assignmentId,
        teacher: session.user.id,
    }).lean();
    if (!assignment) {
        return NextResponse.json({ success: false, message: 'Assignment not found or not assigned to you' }, { status: 404 });
    }

    const attendanceDate = new Date(dateStr);
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
        date: attendanceDate,
        subject: assignment.subject,
        batch: (assignment as any).batch || undefined,
    }).populate('records.student', 'fullName username').lean();

    // Count students in batch
    const studentQuery: any = { role: 'student', status: 'active' };
    if (assignment.batch) {
        studentQuery.batch = assignment.batch;
    }
    const totalStudents = await User.countDocuments(studentQuery);

    return NextResponse.json({
        success: true,
        attendance: attendance ? {
            _id: attendance._id?.toString(),
            status: attendance.status || 'open',
            self_mark_open: attendance.self_mark_open || false,
            self_mark_deadline: attendance.self_mark_deadline,
            is_locked: attendance.is_locked,
            records: attendance.records.map((r: any) => ({
                student_id: r.student?._id?.toString() || r.student?.toString(),
                student_name: r.student?.fullName || 'Unknown',
                username: r.student?.username || '',
                status: r.status,
                marked_by: r.marked_by || 'teacher',
                remarks: r.remarks,
            })),
            marked_count: attendance.records.length,
            self_marked_count: attendance.records.filter((r: any) => r.marked_by === 'self').length,
        } : null,
        total_students: totalStudents,
    });
}
