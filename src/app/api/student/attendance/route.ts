import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import mongoose from 'mongoose';
import '@/models/Academic';

// GET /api/student/attendance — student sees their detailed attendance records
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const studentId = new mongoose.Types.ObjectId(session.user.id);

    // Find all attendance documents where this student appears
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

    return NextResponse.json({
        success: true,
        records,
        summary: { present, absent, late, excused, total, percentage },
    });
}
