import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { ProTestAttempt } from '@/models/TestAttempt';

// ── GET /api/student/tests/[id]/result — fetch result for a submitted test ──
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    const attempt = await ProTestAttempt.findOne({ testId: id, studentId: session.user.id }).lean();
    if (!attempt) {
        return NextResponse.json({ success: false, message: 'No attempt found for this test.' }, { status: 404 });
    }

    // Manual mode results only visible once published
    if (!attempt.resultVisible) {
        return NextResponse.json({
            success: true,
            resultMode: 'manual',
            published: false,
            message: 'Your result will be published by your teacher. Check back later.',
        });
    }

    return NextResponse.json({
        success: true,
        resultMode: attempt.resultVisible ? 'instant' : 'manual',
        published: true,
        marksObtained: attempt.marksObtained,
        totalMarks: attempt.totalMarks,
        negativeMarks: attempt.negativeMarks,
        percentage: attempt.percentage,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        skippedCount: attempt.skippedCount,
        submittedAt: attempt.submittedAt,
        gradedAnswers: attempt.gradedAnswers,
    });
}
