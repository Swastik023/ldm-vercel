import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { ProTest } from '@/models/Test';
import { TestAnswerKey } from '@/models/TestAnswerKey';
import { ProTestAttempt } from '@/models/TestAttempt';
import crypto from 'crypto';
import {
    validateQuestionsFile, validateAnswersFile, validateCombinedFile,
    UploadedQuestionsFile, UploadedAnswersFile, CombinedTestFile,
} from '@/lib/testSchemaValidator';

// ── GET /api/admin/tests — list all tests with attempt counts ───────────────
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '25'));

    // Teachers only see their own tests; admins see all
    const filter: Record<string, unknown> = {};
    if (session.user.role === 'teacher') {
        filter.createdBy = session.user.id;
    }

    const [tests, total] = await Promise.all([
        ProTest.find(filter)
            .populate('batch', 'name intakeMonth joiningYear')
            .populate('subject', 'name code')
            .populate('createdBy', 'fullName')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        ProTest.countDocuments(filter),
    ]);

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

    return NextResponse.json({ success: true, tests: enriched, total, page, pages: Math.ceil(total / limit) });
}

// ── POST /api/admin/tests — upload JSON file(s), validate, store ────────────
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const batchId = formData.get('batchId') as string | null;
        const subjectId = formData.get('subjectId') as string | null;
        const academicYear = (formData.get('academicYear') as string | null)?.trim() || undefined;

        if (!batchId?.trim()) {
            return NextResponse.json({ success: false, message: 'Please select a Batch from the dropdown.' }, { status: 400 });
        }
        if (!subjectId?.trim()) {
            return NextResponse.json({ success: false, message: 'Please select a Subject from the dropdown.' }, { status: 400 });
        }

        // ── Detect upload mode: combined (single file) or dual (two files) ──
        const combinedFile = formData.get('combined') as File | null;
        const questionsFile = formData.get('questions') as File | null;
        const answersFile = formData.get('answers') as File | null;

        await dbConnect();

        if (combinedFile) {
            // ═══════════════════════════════════════════════════════════════
            //  SINGLE-JSON UPLOAD PATH
            // ═══════════════════════════════════════════════════════════════
            if (combinedFile.size > 2 * 1024 * 1024) {
                return NextResponse.json({ success: false, message: 'File exceeds 2MB limit.' }, { status: 413 });
            }

            let parsed: unknown;
            try { parsed = JSON.parse(await combinedFile.text()); }
            catch { return NextResponse.json({ success: false, message: 'File is not valid JSON.' }, { status: 422 }); }

            const validation = validateCombinedFile(parsed);
            if (!validation.valid) {
                return NextResponse.json({ success: false, message: 'Validation failed.', errors: validation.errors }, { status: 422 });
            }

            const cf = parsed as CombinedTestFile;

            // Build questions (without answers) and answer key
            const questionsForDb = cf.questions.map((q, idx) => {
                const qId = `q-${crypto.randomUUID().slice(0, 8)}-${idx}`;
                return {
                    questionId: qId,
                    sectionId: q.sectionId ?? '',
                    type: 'mcq' as const,
                    questionText: q.question,
                    marks: Number(q.marks),
                    options: (['A', 'B', 'C', 'D'] as const).map(label => ({ label, text: q.options[label] })),
                    // Carry forward for answer key construction
                    _correctOption: q.correctOption.toUpperCase(),
                    _reason: q.reason ?? '',
                };
            });

            const test = await ProTest.create({
                title: cf.testTitle.trim(),
                description: cf.description?.trim() ?? '',
                durationMinutes: Number(cf.durationMinutes),
                totalMarks: Number(cf.totalMarks),
                batch: batchId,
                subject: subjectId,
                negativeMarking: Number(cf.negativeMarking ?? 0),
                shuffleQuestions: cf.shuffleQuestions ?? false,
                shuffleOptions: cf.shuffleOptions ?? false,
                resultMode: cf.resultMode ?? 'instant',
                academicYear,
                sections: cf.sections ?? [],
                questions: questionsForDb.map(({ _correctOption, _reason, ...q }) => q),
                createdBy: session.user.id,
                isActive: true,
                isLocked: false,
            });

            await TestAnswerKey.create({
                testId: test._id,
                answers: questionsForDb.map(q => ({
                    questionId: q.questionId,
                    correctAnswer: q._correctOption,
                    reason: q._reason,
                    marks: q.marks,
                })),
            });

            return NextResponse.json({
                success: true,
                testId: test._id,
                parsedQuestions: cf.questions.length,
                warnings: validation.warnings,
                message: `Test "${test.title}" created with ${cf.questions.length} questions.`,
            }, { status: 201 });

        } else if (questionsFile && answersFile) {
            // ═══════════════════════════════════════════════════════════════
            //  DUAL-JSON UPLOAD PATH (existing behavior)
            // ═══════════════════════════════════════════════════════════════
            if (questionsFile.size > 2 * 1024 * 1024 || answersFile.size > 2 * 1024 * 1024) {
                return NextResponse.json({ success: false, message: 'Files exceed 2MB limit.' }, { status: 413 });
            }

            let questionsData: unknown;
            let answersData: unknown;
            try { questionsData = JSON.parse(await questionsFile.text()); }
            catch { return NextResponse.json({ success: false, message: 'questions.json is not valid JSON.' }, { status: 422 }); }
            try { answersData = JSON.parse(await answersFile.text()); }
            catch { return NextResponse.json({ success: false, message: 'answers.json is not valid JSON.' }, { status: 422 }); }

            const qValidation = validateQuestionsFile(questionsData);
            if (!qValidation.valid) {
                return NextResponse.json({ success: false, message: 'questions.json validation failed.', errors: qValidation.errors }, { status: 422 });
            }

            const qFile = questionsData as UploadedQuestionsFile;
            const questionIds = qFile.questions.map(q => q.questionId);

            const aValidation = validateAnswersFile(answersData, questionIds);
            if (!aValidation.valid) {
                return NextResponse.json({ success: false, message: 'answers.json validation failed.', errors: aValidation.errors }, { status: 422 });
            }

            const aFile = answersData as UploadedAnswersFile;
            const answerMap = new Map(aFile.answers.map(a => [a.questionId, a]));

            const meta = qFile.testMeta;
            const test = await ProTest.create({
                title: meta.title.trim(),
                description: meta.description?.trim() ?? '',
                durationMinutes: Number(meta.durationMinutes),
                totalMarks: Number(meta.totalMarks),
                batch: batchId,
                subject: subjectId,
                negativeMarking: Number(meta.negativeMarking ?? 0),
                shuffleQuestions: meta.shuffleQuestions ?? false,
                shuffleOptions: meta.shuffleOptions ?? false,
                resultMode: meta.resultMode ?? 'instant',
                academicYear,
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
                isLocked: false,
            });

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

        } else {
            return NextResponse.json({
                success: false,
                message: 'Please upload either a single combined JSON file or both questions.json and answers.json.',
            }, { status: 400 });
        }
    } catch (err) {
        console.error('POST /api/admin/tests error:', err);
        return NextResponse.json({ success: false, message: `Failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
    }
}
