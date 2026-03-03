import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { ProTest } from '@/models/Test';
import { ProTestAttempt } from '@/models/TestAttempt';
import { User } from '@/models/User';

// ── GET /api/student/tests — tests filtered by student's batch ─────────────
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    // Fetch student's batch
    const student = await User.findById(session.user.id).select('batch').lean();
    if (!student?.batch) {
        return NextResponse.json({ success: true, tests: [] });
    }

    const testsFull = await ProTest.find({ isActive: true, batch: student.batch })
        .populate('subject', 'name code')
        .sort({ createdAt: -1 })
        .lean();

    const studentId = session.user.id;
    const attempted = await ProTestAttempt.find({ studentId })
        .select('testId marksObtained totalMarks percentage correctCount wrongCount skippedCount resultVisible')
        .lean();

    const attemptMap: Record<string, typeof attempted[0]> = {};
    attempted.forEach(a => { attemptMap[String(a.testId)] = a; });

    const enriched = testsFull.map(t => {
        const att = attemptMap[String(t._id)];
        return {
            _id: t._id,
            title: t.title,
            description: t.description,
            durationMinutes: t.durationMinutes,
            totalMarks: t.totalMarks,
            negativeMarking: t.negativeMarking,
            questionCount: t.questions.length,
            subject: t.subject,
            resultMode: t.resultMode,
            isPublished: t.isPublished,
            createdAt: t.createdAt,
            attempted: !!att,
            marksObtained: att?.marksObtained ?? null,
            totalMarksForAttempt: att?.totalMarks ?? null,
            percentage: att?.percentage ?? null,
            correctCount: att?.correctCount ?? null,
            wrongCount: att?.wrongCount ?? null,
            skippedCount: att?.skippedCount ?? null,
            resultVisible: att?.resultVisible ?? false,
        };
    });

    return NextResponse.json({ success: true, tests: enriched });
}
