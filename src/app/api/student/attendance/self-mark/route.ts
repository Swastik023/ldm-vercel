import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Attendance } from '@/models/Attendance';
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

    // Check if student already has a record
    const existingRecord = attendance.records.find(
        (r: any) => r.student.toString() === session.user.id
    );

    if (existingRecord) {
        // Already marked (by teacher or self)
        if (existingRecord.marked_by === 'self') {
            return NextResponse.json({ success: false, message: 'You have already marked your attendance' }, { status: 409 });
        }
        // If teacher already marked them, don't override
        return NextResponse.json({ success: false, message: 'Your attendance has already been recorded by the teacher' }, { status: 409 });
    }

    // Add student as present (self-marked)
    attendance.records.push({
        student: studentId,
        status: 'present',
        marked_by: 'self',
        remarks: '',
    } as any);

    await attendance.save();

    return NextResponse.json({ success: true, message: 'Attendance marked successfully!' });
}
