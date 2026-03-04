import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import mongoose from 'mongoose';

// POST /api/student/attendance/self-mark
// Body: { attendanceId: string }
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { attendanceId } = await request.json();
    if (!attendanceId) {
        return NextResponse.json({ success: false, message: 'attendanceId required' }, { status: 400 });
    }

    const studentId = new mongoose.Types.ObjectId(session.user.id);

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
        return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 });
    }

    // Validate self-mark window is open
    if (!attendance.self_mark_open) {
        return NextResponse.json({ success: false, message: 'Self-marking is not enabled for this session' }, { status: 403 });
    }

    if (attendance.self_mark_deadline && new Date() > attendance.self_mark_deadline) {
        return NextResponse.json({ success: false, message: 'Self-marking window has expired' }, { status: 403 });
    }

    if (attendance.status === 'finalized') {
        return NextResponse.json({ success: false, message: 'Session is finalized' }, { status: 403 });
    }

    // ── Batch verification — student must belong to the same batch ──────
    if (attendance.batch) {
        const student = await User.findById(session.user.id).select('batch').lean();
        if (!student?.batch || student.batch.toString() !== attendance.batch.toString()) {
            return NextResponse.json({ success: false, message: 'This attendance session is not for your batch.' }, { status: 403 });
        }
    }

    // M-05 fix: Atomic self-mark — prevents TOCTOU race condition
    // Uses $push with condition that student doesn't already exist in records
    const result = await Attendance.findOneAndUpdate(
        {
            _id: attendanceId,
            'records.student': { $ne: studentId },  // Only if student NOT already in records
        },
        {
            $push: {
                records: {
                    student: studentId,
                    status: 'present',
                    marked_by: 'self',
                    remarks: '',
                },
            },
        },
        { new: true }
    );

    if (!result) {
        // Student already exists in records — either self-marked or teacher-marked
        const existing = attendance.records.find(
            (r: any) => r.student.toString() === session.user.id
        );
        if (existing?.marked_by === 'self') {
            return NextResponse.json({ success: false, message: 'You have already marked your attendance' }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: 'Your attendance has already been recorded by the teacher' }, { status: 409 });
    }

    return NextResponse.json({ success: true, message: 'Attendance marked successfully!' });
}
