import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Attendance } from '@/models/Attendance';
import '@/models/Academic';

// GET /api/admin/attendance?date=YYYY-MM-DD&subject=ID&section=A
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const subject = searchParams.get('subject');
    const section = searchParams.get('section');

    if (!date) {
        return NextResponse.json({ success: false, message: 'Date required' }, { status: 400 });
    }

    const query: any = { date: new Date(date) };
    if (subject) query.subject = subject;
    if (section) query.section = section;

    const records = await Attendance.find(query)
        .populate('subject', 'name code')
        .populate('teacher', 'fullName')
        .populate('records.student', 'fullName username email');

    // Flatten for table view
    const flatRecords: any[] = [];
    records.forEach(att => {
        att.records.forEach((stuRec: any) => {
            flatRecords.push({
                unique_id: `${att._id}_${stuRec.student._id}`,
                attendance_id: att._id,
                student_id: (stuRec.student as any).username || (stuRec.student as any)._id,
                student_name: (stuRec.student as any).fullName,
                student_obj_id: (stuRec.student as any)._id,
                subject_name: (att.subject as any).name,
                subject_code: (att.subject as any).code,
                attendance_date: att.date.toISOString().split('T')[0],
                status: stuRec.status,
                is_locked: att.is_locked,
                teacher_name: (att.teacher as any).fullName,
                remarks: stuRec.remarks,
                marked_by: stuRec.marked_by || 'teacher',
            });
        });
    });

    return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(flatRecords)) });
}

// PATCH /api/admin/attendance — bulk lock/unlock
export async function PATCH(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { action, attendanceIds } = await request.json();
    if (!action || !attendanceIds?.length) {
        return NextResponse.json({ success: false, message: 'Missing params' }, { status: 400 });
    }

    await Attendance.updateMany(
        { _id: { $in: attendanceIds } },
        { $set: { is_locked: action === 'lock' } }
    );

    return NextResponse.json({ success: true, message: `Records ${action}ed` });
}

// PUT /api/admin/attendance — edit single student record
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { attendanceId, studentId, status, remarks } = await request.json();
    if (!attendanceId || !studentId || !status) {
        return NextResponse.json({ success: false, message: 'Missing params' }, { status: 400 });
    }

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) {
        return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }

    const studentRecord = attendance.records.find((r: any) => r.student.toString() === studentId);
    if (studentRecord) {
        studentRecord.status = status;
        studentRecord.remarks = remarks || '';
        studentRecord.marked_by = 'admin';
    } else {
        return NextResponse.json({ success: false, message: 'Student not in this record' }, { status: 404 });
    }

    await attendance.save();

    return NextResponse.json({ success: true });
}
