import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Test } from '@/models/Test';
import { TestAttempt } from '@/models/TestAttempt';
import { parseMCQText } from '@/lib/mcqParser';

// GET /api/admin/tests — list all tests with attempt counts
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const tests = await Test.find().sort({ createdAt: -1 }).lean();
    const testIds = tests.map(t => t._id);
    const attemptCounts = await TestAttempt.aggregate([
        { $match: { testId: { $in: testIds } } },
        { $group: { _id: '$testId', count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    attemptCounts.forEach(a => { countMap[String(a._id)] = a.count; });
    const enriched = tests.map(t => ({ ...t, attemptCount: countMap[String(t._id)] ?? 0 }));
    return NextResponse.json({ success: true, tests: enriched });
}

// POST /api/admin/tests — parse MCQ text + save test
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const { title, duration, rawText } = await req.json();

    if (!title?.trim()) return NextResponse.json({ success: false, message: 'Test title is required.' }, { status: 400 });
    if (!duration || duration < 1) return NextResponse.json({ success: false, message: 'Duration must be at least 1 minute.' }, { status: 400 });
    if (!rawText?.trim()) return NextResponse.json({ success: false, message: 'Please paste MCQ questions.' }, { status: 400 });

    const { questions, errors } = parseMCQText(rawText);
    if (questions.length === 0) {
        return NextResponse.json({ success: false, message: 'No valid questions found.', errors }, { status: 422 });
    }

    const test = await Test.create({
        title: title.trim(),
        duration: Number(duration),
        questions,
        createdBy: session.user.id,
        isActive: true,
    });

    return NextResponse.json({ success: true, test, parsedCount: questions.length, warnings: errors }, { status: 201 });
}
