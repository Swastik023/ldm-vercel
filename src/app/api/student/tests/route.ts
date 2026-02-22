import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Test } from '@/models/Test';
import { TestAttempt } from '@/models/TestAttempt';

// GET /api/student/tests — list active tests (hide correct answers)
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const tests = await Test.find({ isActive: true })
        .select('title duration questions createdAt')
        .lean();

    // Find which tests this student has already attempted
    const studentId = session.user.id;
    const attempted = await TestAttempt.find({ studentId }).select('testId score percentage').lean();
    const attemptedMap: Record<string, { score: number; percentage: number }> = {};
    attempted.forEach(a => { attemptedMap[String(a.testId)] = { score: a.score, percentage: a.percentage }; });

    const enriched = tests.map(t => ({
        _id: t._id,
        title: t.title,
        duration: t.duration,
        questionCount: t.questions.length,
        createdAt: t.createdAt,
        attempted: !!attemptedMap[String(t._id)],
        score: attemptedMap[String(t._id)]?.score ?? null,
        percentage: attemptedMap[String(t._id)]?.percentage ?? null,
    }));

    return NextResponse.json({ success: true, tests: enriched });
}
