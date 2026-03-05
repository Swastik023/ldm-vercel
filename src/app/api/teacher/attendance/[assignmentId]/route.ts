import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Assignment } from '@/models/Academic';
import '@/models/Academic';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import { safeParseJSON } from '@/lib/validate';

const VALID_STATUSES = ['present', 'absent', 'late', 'excused'];

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

    const { assignmentId } = await params;
    const [body, parseErr] = await safeParseJSON(request);
    if (parseErr) return parseErr;

    const { date, records } = body;
    // records: Array<{ studentId: string; status: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }>

    if (!date || !Array.isArray(records) || records.length === 0) {
        return NextResponse.json({ success: false, message: 'Date and records array are required.' }, { status: 400 });
    }

    // Validate all status values
    for (const r of records) {
        if (!r.studentId || !VALID_STATUSES.includes(r.status)) {
            return NextResponse.json({ success: false, message: `Invalid record: each must have studentId and status (${VALID_STATUSES.join('/')}).` }, { status: 400 });
        }
    }

    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
        return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Fetch existing attendance to check locks and preserve tags
    let attendance = await Attendance.findOne({
        date: attendanceDate,
        subject: assignment.subject,
        batch: assignment.batch || undefined,
    });

    if (attendance && (attendance.is_locked || attendance.status === 'finalized')) {
        return NextResponse.json({ success: false, message: 'Attendance is finalized and locked' }, { status: 403 });
    }

    if (!attendance) {
        // Create new
        attendance = new Attendance({
            date: attendanceDate,
            subject: assignment.subject,
            teacher: new mongoose.Types.ObjectId(session.user.id),
            ...(assignment.session ? { session: assignment.session } : {}),
            batch: assignment.batch || undefined,
            records: [],
            status: 'open',
        });
    }

    // Merge records smartly to preserve `marked_by`
    const existingMap = new Map((attendance.records || []).map((r: any) => [r.student.toString(), r]));

    const newRecords = records.map((r: any) => {
        const exist: any = existingMap.get(r.studentId);

        // If it's a new record or status changed, default to teacher
        let markedBy: 'teacher' | 'admin' | 'self' = 'teacher';

        if (exist) {
            // Keep original marked_by if status didn't change
            if (exist.status === r.status) {
                markedBy = exist.marked_by || 'teacher';
            }
        }

        return {
            student: new mongoose.Types.ObjectId(r.studentId),
            status: r.status,
            remarks: r.remarks || '',
            marked_by: markedBy,
        };
    });

    attendance.records = newRecords;
    attendance.marked_at = new Date();

    await attendance.save();

    return NextResponse.json({ success: true, message: 'Attendance saved' });
}
