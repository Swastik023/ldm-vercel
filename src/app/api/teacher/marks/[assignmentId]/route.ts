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
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'teacher') return NextResponse.json({ success: false }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const examType = searchParams.get('exam_type') || 'midterm';

    await dbConnect();

    // 1. Get Assignment
    const { assignmentId } = await params;
    const assignment = await Assignment.findOne({
        _id: assignmentId,
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
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'teacher') return NextResponse.json({ success: false }, { status: 401 });

    const body = await req.json();
    const { exam_type, max_marks, marks } = body;

    if (!exam_type || !max_marks || !marks || !Array.isArray(marks)) {
        return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
    }

    if (max_marks <= 0) {
        return NextResponse.json({ success: false, message: 'Max marks must be greater than 0.' }, { status: 400 });
    }

    await dbConnect();

    const { assignmentId } = await params;
    const assignment = await Assignment.findOne({
        _id: assignmentId,
        teacher: session.user.id
    }).lean();

    if (!assignment) return NextResponse.json({ success: false, message: 'Assignment not found' }, { status: 404 });

    // Validate + format marks — reject if any student exceeds max_marks
    const invalidEntries: string[] = [];
    const formattedMarks = marks.map((m: any) => {
        const val = Number(m.marks_obtained) || 0;
        if (val < 0 || val > max_marks) {
            invalidEntries.push(m.student);
        }
        return {
            student: m.student,
            marks_obtained: Math.max(0, val),
            remarks: m.remarks || ''
        };
    });

    if (invalidEntries.length > 0) {
        return NextResponse.json({
            success: false,
            message: `Marks for ${invalidEntries.length} student(s) are outside the valid range (0 – ${max_marks}). Please correct and try again.`,
        }, { status: 400 });
    }

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
