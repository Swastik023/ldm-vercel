import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { ProTestAttempt } from '@/models/TestAttempt';

// POST /api/student/tests/[id]/violation — log a security violation event
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'student') {
        return NextResponse.json({ success: false }, { status: 401 });
    }
    const { id } = await params;
    await dbConnect();

    const body = await req.json().catch(() => ({}));
    const { type = 'tab_switch', count = 1 } = body;

    // Append violation to the attempt doc if it exists (non-blocking update)
    try {
        await ProTestAttempt.findOneAndUpdate(
            { testId: id, studentId: session.user.id },
            {
                $push: {
                    violations: {
                        type,
                        count,
                        timestamp: new Date(),
                    },
                },
            }
        );
    } catch { /* non-critical */ }

    return NextResponse.json({ success: true });
}
