import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import Notice from '@/models/Notice';
import { User } from '@/models/User';
import mongoose from 'mongoose';
// Register models needed for populate()
import '@/models/Class';
import { Batch, Session } from '@/models/Academic';
import '@/models/Academic';

// GET /api/student/dashboard — returns real data for the logged-in student
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const studentId = new mongoose.Types.ObjectId(session.user.id);

    // Fetch user profile (with session+batch+class populated)
    const userDoc = await User.findById(studentId)
        .select('-password')
        .populate('session', 'name')
        .populate('batch', 'name')
        .populate('classId', 'className sessionFrom sessionTo')
        .populate('programId', 'name')
        .lean();

    // Fetch attendance records where this student appears
    const attendanceRecords = await Attendance.find({
        'records.student': studentId
    }).lean();

    let present = 0;
    let absent = 0;
    let late = 0;

    attendanceRecords.forEach(record => {
        const myRecord = record.records.find(
            r => r.student.toString() === session.user.id
        );
        if (!myRecord) return;
        if (myRecord.status === 'present') present++;
        else if (myRecord.status === 'absent') absent++;
        else if (myRecord.status === 'late') late++;
    });

    const total = present + absent + late;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 0;

    // Fetch recent active notices as notifications
    const notices = await Notice.find({ isActive: true })
        .select('title createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

    return NextResponse.json({
        success: true,
        profile: {
            id: userDoc?._id?.toString() || session.user.id,
            name: userDoc?.fullName || session.user.name || '',
            email: userDoc?.email || session.user.email || '',
            username: userDoc?.username || '',
            mobileNumber: (userDoc as any)?.mobileNumber || null,
            session: (userDoc?.session as any)?.name || null,
            batch: (userDoc?.batch as any)?.name || null,
            className: (userDoc?.classId as any)?.className || null,
            sessionFrom: (userDoc as any)?.sessionFrom || null,
            sessionTo: (userDoc as any)?.sessionTo || null,
            rollNumber: (userDoc as any)?.rollNumber || null,
            programName: (userDoc?.programId as any)?.name || null,
            joiningMonth: (userDoc as any)?.joiningMonth || null,
            joiningYear: (userDoc as any)?.joiningYear || null,
            courseEndDate: (userDoc as any)?.courseEndDate || null,
            role: userDoc?.role || 'student',
        },
        attendance: {
            present,
            absent,
            late,
            total,
            percentage,
        },
        notices: notices.map(n => ({
            id: n._id?.toString(),
            message: n.title,
            createdAt: n.createdAt,
        })),
    });
}
