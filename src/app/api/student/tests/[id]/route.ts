import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { ProTest } from '@/models/Test';
import { TestAnswerKey } from '@/models/TestAnswerKey';
import { ProTestAttempt } from '@/models/TestAttempt';
import { User } from '@/models/User';

// helper: shuffle array (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ── GET /api/student/tests/[id] — load test questions (no answers) ──────────
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    // Verify student's batch matches
    const student = await User.findById(session.user.id).select('batch').lean();
    const test = await ProTest.findOne({ _id: id, isActive: true })
        .populate('subject', 'name code')
        .lean();

    if (!test) return NextResponse.json({ success: false, message: 'Test not found or not available.' }, { status: 404 });
    if (String(test.batch) !== String(student?.batch)) {
        return NextResponse.json({ success: false, message: 'This test is not assigned to your batch.' }, { status: 403 });
    }

    // Check already attempted
    const existing = await ProTestAttempt.findOne({ testId: id, studentId: session.user.id });
    if (existing) {
        return NextResponse.json({ success: false, message: 'You have already submitted this test.', alreadyAttempted: true }, { status: 409 });
    }

    // Auto-lock: Once first student loads the test, lock it to prevent question edits
    if (!test.isLocked) {
        await ProTest.updateOne({ _id: id, isLocked: false }, { $set: { isLocked: true } });
    }

    // Build safe questions (NO correct answers)
    const labels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    let questions = test.questions.map(q => {
        let opts = test.shuffleOptions ? shuffle(q.options) : q.options;
        // Re-label options sequentially so UI always shows A, B, C, D in order
        opts = opts.map((o, i) => ({ label: labels[i] ?? o.label, text: o.text }));
        return {
            questionId: q.questionId,
            sectionId: q.sectionId,
            type: q.type,
            questionText: q.questionText,
            marks: q.marks,
            options: opts,
        };
    });

    if (test.shuffleQuestions) questions = shuffle(questions);

    return NextResponse.json({
        success: true,
        test: {
            _id: test._id,
            title: test.title,
            description: test.description,
            durationMinutes: test.durationMinutes,
            totalMarks: test.totalMarks,
            negativeMarking: test.negativeMarking,
            questionCount: test.questions.length,
            sections: test.sections,
            resultMode: test.resultMode,
            subject: test.subject,
        },
        questions,
        // M-03: Server-side start timestamp for timing enforcement
        serverStartedAt: new Date().toISOString(),
    });
}

// ── POST /api/student/tests/[id] — submit answers, grade, store ─────────────
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    const test = await ProTest.findById(id).lean();
    if (!test) return NextResponse.json({ success: false, message: 'Test not found.' }, { status: 404 });

    const answerKey = await TestAnswerKey.findOne({ testId: id }).lean();
    if (!answerKey) return NextResponse.json({ success: false, message: 'Answer key not found. Contact admin.' }, { status: 500 });

    const body = await req.json();
    const { answers, startedAt: clientStartedAt } = body;
    if (!Array.isArray(answers)) {
        return NextResponse.json({ success: false, message: 'Invalid answers format.' }, { status: 400 });
    }

    // M-03: Server-side timing enforcement
    const GRACE_MINUTES = 2; // Allow 2 extra minutes for network latency
    if (clientStartedAt) {
        const started = new Date(clientStartedAt);
        const now = new Date();
        const elapsedMinutes = (now.getTime() - started.getTime()) / (1000 * 60);
        if (elapsedMinutes > test.durationMinutes + GRACE_MINUTES) {
            return NextResponse.json({
                success: false,
                message: `Time limit exceeded. Test duration: ${test.durationMinutes} minutes. You took ${Math.round(elapsedMinutes)} minutes.`,
            }, { status: 400 });
        }
    }

    // Build student answer map
    const studentMap: Record<string, string | null> = {};
    (answers as { questionId: string; selectedOption: string | null }[]).forEach(a => {
        studentMap[a.questionId] = a.selectedOption?.toUpperCase() ?? null;
    });

    // Build answer key map
    const keyMap: Record<string, typeof answerKey.answers[0]> = {};
    answerKey.answers.forEach(a => { keyMap[a.questionId] = a; });

    // Grade
    let marksObtained = 0;
    let negativeMarks = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const gradedAnswers = test.questions.map(q => {
        const key = keyMap[q.questionId];
        const studentAns = studentMap[q.questionId] ?? null;
        const correctAns = key?.correctAnswer ?? '';
        const isCorrect = !!studentAns && studentAns === correctAns;
        const isSkipped = studentAns === null;

        // Map option letters to their full texts
        const studentAnsOption = q.options?.find(o => o.label === studentAns);
        const correctAnsOption = q.options?.find(o => o.label === correctAns);

        let marksAwarded = 0;
        if (isCorrect) {
            marksAwarded = q.marks;
            correctCount++;
            marksObtained += q.marks;
        } else if (isSkipped) {
            skippedCount++;
        } else {
            wrongCount++;
            marksAwarded = -test.negativeMarking;
            negativeMarks += test.negativeMarking;
            marksObtained -= test.negativeMarking;
        }

        return {
            questionId: q.questionId,
            questionText: q.questionText,
            studentAnswer: studentAns ? `${studentAns} - ${studentAnsOption?.text ?? 'Unknown'}` : null,
            correctAnswer: correctAns ? `${correctAns} - ${correctAnsOption?.text ?? 'Unknown'}` : null,
            reason: key?.reason ?? '',
            marksAwarded,
            isCorrect,
        };
    });

    marksObtained = Math.max(0, marksObtained); // Don't go below 0
    const percentage = Math.round((marksObtained / test.totalMarks) * 100);
    const resultVisible = test.resultMode === 'instant';

    // Atomic create — the unique compound index { testId, studentId } prevents
    // duplicate submissions even under concurrent requests (no TOCTOU race).
    let attempt;
    try {
        attempt = await ProTestAttempt.create({
            testId: id,
            studentId: session.user.id,
            startedAt: clientStartedAt ? new Date(clientStartedAt) : new Date(),
            submittedAt: new Date(),
            status: 'submitted',
            answers: test.questions.map(q => ({
                questionId: q.questionId,
                selectedOption: studentMap[q.questionId] ?? null,
            })),
            totalMarks: test.totalMarks,
            marksObtained,
            negativeMarks,
            correctCount,
            wrongCount,
            skippedCount,
            percentage,
            gradedAnswers,
            resultVisible,
        });
    } catch (err: any) {
        // E11000 duplicate key error = student already submitted
        if (err?.code === 11000) {
            return NextResponse.json({ success: false, message: 'You have already submitted this test.', alreadyAttempted: true }, { status: 409 });
        }
        throw err; // Re-throw unexpected errors
    }

    // Instant mode — return full result
    if (test.resultMode === 'instant') {
        return NextResponse.json({
            success: true,
            resultMode: 'instant',
            attemptId: attempt._id,
            marksObtained,
            totalMarks: test.totalMarks,
            negativeMarks,
            percentage,
            correctCount,
            wrongCount,
            skippedCount,
            gradedAnswers,
        });
    }

    // Manual mode — acknowledge only
    return NextResponse.json({
        success: true,
        resultMode: 'manual',
        attemptId: attempt._id,
        message: 'Your test has been submitted successfully. Results will be published by your teacher.',
    });
}
