import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Test } from '@/models/Test';
import { TestAttempt } from '@/models/TestAttempt';

// GET /api/student/tests/[id] — fetch test questions (hide correct answers)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    const test = await Test.findOne({ _id: id, isActive: true }).lean();
    if (!test) return NextResponse.json({ success: false, message: 'Test not found or not available.' }, { status: 404 });

    // Check if already attempted
    const existing = await TestAttempt.findOne({ testId: id, studentId: session.user.id });
    if (existing) {
        return NextResponse.json({ success: false, message: 'You have already submitted this test.', alreadyAttempted: true, attemptId: existing._id }, { status: 409 });
    }

    // Strip correct answers before sending to client
    const safeQuestions = test.questions.map((q, i) => ({
        index: i,
        questionText: q.questionText,
        options: q.options,
    }));

    return NextResponse.json({
        success: true,
        test: { _id: test._id, title: test.title, duration: test.duration, questionCount: test.questions.length },
        questions: safeQuestions,
    });
}

// POST /api/student/tests/[id] — submit answers & calculate score
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    // Prevent re-submission
    const existing = await TestAttempt.findOne({ testId: id, studentId: session.user.id });
    if (existing) {
        return NextResponse.json({ success: false, message: 'You have already submitted this test.', alreadyAttempted: true }, { status: 409 });
    }

    const test = await Test.findById(id).lean();
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });

    const { answers } = await req.json(); // [{ questionIndex, selectedOption }]
    if (!Array.isArray(answers)) {
        return NextResponse.json({ success: false, message: 'Invalid answers format.' }, { status: 400 });
    }

    // Score calculation
    let score = 0;
    const totalQuestions = test.questions.length;
    const answerMap: Record<number, string> = {};
    answers.forEach((a: { questionIndex: number; selectedOption: string }) => {
        answerMap[a.questionIndex] = a.selectedOption?.toUpperCase();
    });

    test.questions.forEach((q, i) => {
        if (answerMap[i] === q.correctAnswer) score++;
    });

    const percentage = Math.round((score / totalQuestions) * 100);

    const attempt = await TestAttempt.create({
        testId: id,
        studentId: session.user.id,
        answers,
        score,
        totalQuestions,
        percentage,
        submittedAt: new Date(),
    });

    // Return result + answer key for review
    const reviewData = test.questions.map((q, i) => ({
        index: i,
        questionText: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        studentAnswer: answerMap[i] ?? null,
        isCorrect: answerMap[i] === q.correctAnswer,
    }));

    return NextResponse.json({
        success: true,
        attemptId: attempt._id,
        score,
        totalQuestions,
        percentage,
        review: reviewData,
    });
}
