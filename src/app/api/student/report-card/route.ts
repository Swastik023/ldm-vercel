import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Result } from '@/models/Result';
import { User } from '@/models/User';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        await dbConnect();

        // Find the student's batch
        const student = await User.findById(session.user.id).lean();
        if (!student || !student.batch) {
            return NextResponse.json({ success: false, message: 'Batch not assigned' }, { status: 404 });
        }

        // Find all published results for this student's batch
        const results = await Result.find({
            batch: student.batch,
            // is_published: true // Depending on whether Admin needs to publish them first. For MVP, we can show them or filter by is_published.
        })
            .populate('subject', 'name code')
            .populate('teacher', 'fullName')
            .lean();

        // Filter out marks only for this student
        const studentReport: any = {};

        results.forEach(res => {
            const studentMark = res.marks?.find((m: any) => m.student.toString() === student._id.toString());
            if (studentMark) {
                const sem = res.semester || 1;
                if (!studentReport[sem]) studentReport[sem] = { semester: sem, results: [] };

                studentReport[sem].results.push({
                    subject: (res.subject as any)?.name || 'Unknown',
                    code: (res.subject as any)?.code || '',
                    teacher: (res.teacher as any)?.fullName || '',
                    exam_type: res.exam_type,
                    max_marks: res.max_marks,
                    marks_obtained: studentMark.marks_obtained,
                    remarks: studentMark.remarks
                });
            }
        });

        // Convert grouped object to array
        const reportArray = Object.values(studentReport).sort((a: any, b: any) => b.semester - a.semester);

        return NextResponse.json({
            success: true,
            report: reportArray
        });
    } catch (error) {
        console.error("Report Card Error:", error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
