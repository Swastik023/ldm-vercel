import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Assignment, Batch } from '@/models/Academic';
import { User } from '@/models/User';
import { Result } from '@/models/Result';
import '@/models/Academic';

export async function GET(
    req: Request,
    { params }: { params: { assignmentId: string } }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'teacher') return NextResponse.json({ success: false }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const examType = searchParams.get('exam_type') || 'midterm';

    await dbConnect();

    // 1. Get Assignment
    const assignment = await Assignment.findOne({
        _id: params.assignmentId,
        teacher: session.user.id
    }).populate('batch').lean();

    if (!assignment) return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });

    // 2. Get Students in that Batch
    const students = await User.find({
        role: 'student',
        status: 'active',
        batch: assignment.batch?._id
    }).select('fullName username').sort({ fullName: 1 }).lean();

    // 3. Get existing Result if any
    const existingResult = await Result.findOne({
        batch: assignment.batch?._id,
        subject: assignment.subject,
        exam_type: examType
    }).lean();

    // 4. Map students to their existing marks
    const studentList = students.map(s => {
        const existingMark = existingResult?.marks?.find((m: any) => m.student.toString() === s._id.toString());
        return {
            _id: s._id,
            fullName: s.fullName,
            rollNo: s.username, // using username as rollNo/ID
            marks_obtained: existingMark ? existingMark.marks_obtained : '',
            remarks: existingMark?.remarks || ''
        };
    });

    return NextResponse.json({
        success: true,
        students: studentList,
        max_marks: existingResult?.max_marks || 100,
        is_published: existingResult?.is_published || false
    });
}

export async function POST(
    req: Request,
    { params }: { params: { assignmentId: string } }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'teacher') return NextResponse.json({ success: false }, { status: 401 });

    const body = await req.json();
    const { exam_type, max_marks, marks } = body;

    if (!exam_type || !max_marks || !marks || !Array.isArray(marks)) {
        return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    await dbConnect();

    const assignment = await Assignment.findOne({
        _id: params.assignmentId,
        teacher: session.user.id
    }).lean();

    if (!assignment) return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });

    // Ensure numeric marks
    const formattedMarks = marks.map((m: any) => ({
        student: m.student,
        marks_obtained: Number(m.marks_obtained) || 0,
        remarks: m.remarks || ''
    }));

    try {
        const result = await Result.findOneAndUpdate(
            {
                batch: assignment.batch,
                subject: assignment.subject,
                exam_type: exam_type
            },
            {
                $set: {
                    session: assignment.session,
                    program: (assignment as any).program || null, // Will fetch from batch below
                    semester: 1, // Will fetch below
                    teacher: session.user.id,
                    max_marks,
                    marks: formattedMarks
                }
            },
            { new: true, upsert: true }
        );

        // Fix program/semester if it's a new upsert
        if (!result.program) {
            const batch = await Batch.findById(assignment.batch);
            if (batch) {
                result.program = batch.program;
                result.semester = batch.current_semester;
                await result.save();
            }
        }

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error("Save Marks Error:", error);
        return NextResponse.json({ success: false, message: 'Failed to save marks' }, { status: 500 });
    }
}
