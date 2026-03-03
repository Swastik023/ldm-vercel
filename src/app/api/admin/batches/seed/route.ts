import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { seedBatches } from '@/actions/academic';

// ── POST /api/admin/batches/seed — idempotent batch seeding ────────────────
// Body (optional): { fromYear: number, toYear: number }
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    let fromYear: number | undefined;
    let toYear: number | undefined;

    try {
        const body = await req.json();
        if (body.fromYear) fromYear = Number(body.fromYear);
        if (body.toYear) toYear = Number(body.toYear);
    } catch {
        // No body is fine — defaults to current year + 2 years ahead
    }

    const result = await seedBatches(fromYear, toYear);

    if (!result.success) {
        return NextResponse.json({ success: false, message: result.error }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        message: result.message,
        created: result.created,
        skipped: result.skipped,
    });
}
