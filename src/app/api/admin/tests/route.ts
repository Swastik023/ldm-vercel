import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { ProTest } from '@/models/Test';
import { TestAnswerKey } from '@/models/TestAnswerKey';
import { ProTestAttempt } from '@/models/TestAttempt';
import { validateQuestionsFile, validateAnswersFile, UploadedQuestionsFile, UploadedAnswersFile } from '@/lib/testSchemaValidator';

// ── GET /api/admin/tests — list all tests with attempt counts ───────────────
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const tests = await ProTest.find()
        .populate('batch', 'name intakeMonth joiningYear')
        .populate('subject', 'name code')
        .populate('createdBy', 'fullName')
        .sort({ createdAt: -1 })
        .lean();

    const testIds = tests.map(t => t._id);
    const attemptCounts = await ProTestAttempt.aggregate([
        { $match: { testId: { $in: testIds } } },
        { $group: { _id: '$testId', count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    attemptCounts.forEach(a => { countMap[String(a._id)] = a.count; });

    const enriched = tests.map(t => ({
        ...t,
        questions: undefined,            // Don't send full questions in list
        questionCount: (t.questions ?? []).length,
        attemptCount: countMap[String(t._id)] ?? 0,
    }));

    return NextResponse.json({ success: true, tests: enriched });
}

// ── POST /api/admin/tests — upload dual JSON files, validate, store ─────────
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const questionsFile = formData.get('questions') as File | null;
    const answersFile = formData.get('answers') as File | null;

    if (!questionsFile || !answersFile) {
        return NextResponse.json({ success: false, message: 'Both questions.json and answers.json files are required.' }, { status: 400 });
    }

    // ── Parse JSON files ─────────────────────────────────────────────────
    let questionsData: unknown;
    let answersData: unknown;

    try {
        questionsData = JSON.parse(await questionsFile.text());
    } catch {
        return NextResponse.json({ success: false, message: 'questions.json is not valid JSON.' }, { status: 422 });
    }
    try {
        answersData = JSON.parse(await answersFile.text());
    } catch {
        return NextResponse.json({ success: false, message: 'answers.json is not valid JSON.' }, { status: 422 });
    }

    // ── Validate questions.json ──────────────────────────────────────────
    const qValidation = validateQuestionsFile(questionsData);
    if (!qValidation.valid) {
        return NextResponse.json({ success: false, message: 'questions.json validation failed.', errors: qValidation.errors }, { status: 422 });
    }

    const qFile = questionsData as UploadedQuestionsFile;
    const questionIds = qFile.questions.map(q => q.questionId);

    // ── Validate answers.json (cross-reference questionIds) ──────────────
    const aValidation = validateAnswersFile(answersData, questionIds);
    if (!aValidation.valid) {
        return NextResponse.json({ success: false, message: 'answers.json validation failed.', errors: aValidation.errors }, { status: 422 });
    }

    const aFile = answersData as UploadedAnswersFile;
    const answerMap = new Map(aFile.answers.map(a => [a.questionId, a]));

    await dbConnect();

    // ── Save ProTest ─────────────────────────────────────────────────────
    const meta = qFile.testMeta;
    const test = await ProTest.create({
        title: meta.title.trim(),
        description: meta.description?.trim() ?? '',
        durationMinutes: Number(meta.durationMinutes),
        totalMarks: Number(meta.totalMarks),
        batch: meta.batch,
        subject: meta.subject,
        negativeMarking: Number(meta.negativeMarking ?? 0),
        shuffleQuestions: meta.shuffleQuestions ?? false,
        shuffleOptions: meta.shuffleOptions ?? false,
        resultMode: meta.resultMode ?? 'instant',
        sections: qFile.sections ?? [],
        questions: qFile.questions.map(q => ({
            questionId: q.questionId,
            sectionId: q.sectionId ?? '',
            type: 'mcq',
            questionText: q.questionText,
            marks: Number(q.marks),
            options: q.options.map(o => ({ label: o.label.toUpperCase(), text: o.text })),
        })),
        createdBy: session.user.id,
        isActive: true,
    });

    // ── Save TestAnswerKey (secure, separate collection) ─────────────────
    await TestAnswerKey.create({
        testId: test._id,
        answers: qFile.questions.map(q => {
            const answer = answerMap.get(q.questionId);
            return {
                questionId: q.questionId,
                correctAnswer: answer?.correctAnswer?.toUpperCase() ?? '',
                reason: answer?.reason ?? '',
                marks: Number(q.marks),
            };
        }),
    });

    return NextResponse.json({
        success: true,
        testId: test._id,
        parsedQuestions: qFile.questions.length,
        warnings: [...qValidation.warnings, ...aValidation.warnings],
        message: `Test "${test.title}" created with ${qFile.questions.length} questions.`,
    }, { status: 201 });
}
