import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Batch, Program } from '@/models/Academic';

// ── GET /api/admin/batches — list batches with filters ─────────────────────
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const programId = searchParams.get('programId');
    const year = searchParams.get('year');
    const intakeMonth = searchParams.get('intakeMonth');
    const activeOnly = searchParams.get('active') !== 'false';

    const query: Record<string, unknown> = {};
    if (activeOnly) query.is_active = true;
    if (programId) query.program = programId;
    if (year) query.joiningYear = Number(year);
    if (intakeMonth) query.intakeMonth = intakeMonth;

    const batches = await Batch.find(query)
        .populate('program', 'name code duration_years')
        .sort({ joiningYear: -1, intakeMonth: 1 })
        .lean();

    return NextResponse.json({ success: true, batches });
}

// ── POST /api/admin/batches — create a single batch ────────────────────────
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();

    const body = await req.json();
    const { programId, joiningYear, intakeMonth } = body;

    if (!programId || !joiningYear || !intakeMonth) {
        return NextResponse.json({ success: false, message: 'programId, joiningYear, and intakeMonth are required.' }, { status: 400 });
    }

    const program = await Program.findById(programId).lean();
    if (!program) return NextResponse.json({ success: false, message: 'Program not found.' }, { status: 404 });

    const monthCode = intakeMonth === 'January' ? 'JAN' : 'JUL';
    const code = program.code.toUpperCase();
    const batchCode = `${code}_${joiningYear}_${monthCode}`;
    const startDate = intakeMonth === 'January' ? new Date(joiningYear, 0, 1) : new Date(joiningYear, 6, 1);
    const expectedEndDate = new Date(startDate);
    expectedEndDate.setFullYear(expectedEndDate.getFullYear() + (program.duration_years || 3));

    const now = new Date();
    let status: 'upcoming' | 'active' | 'completed' = 'upcoming';
    if (now > expectedEndDate) status = 'completed';
    else if (now >= startDate) status = 'active';

    // Check for existing
    const existing = await Batch.findOne({ program: programId, joiningYear, intakeMonth });
    if (existing) {
        return NextResponse.json({ success: false, message: `Batch "${existing.name}" already exists for this program, year, and intake.` }, { status: 409 });
    }

    const batch = await Batch.create({
        name: batchCode,
        batchCode,
        program: programId,
        intakeMonth,
        joiningYear: Number(joiningYear),
        courseDurationYears: program.duration_years || 3,
        startDate,
        expectedEndDate,
        status,
        capacity: body.capacity ?? 60,
        current_students: 0,
        current_semester: 1,
        is_active: status !== 'completed',
    });

    const populated = await Batch.findById(batch._id).populate('program', 'name code').lean();
    return NextResponse.json({ success: true, batch: populated }, { status: 201 });
}
