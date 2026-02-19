import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeeStructure } from '@/models/FeeStructure';
import { FeePayment } from '@/models/FeePayment';
import '@/models/Academic'; // registers Program & Session for populate()


// GET /api/admin/finance/fee-structures — list all
export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const structures = await FeeStructure.find({ is_active: true })
        .populate('program', 'name code')
        .populate('session', 'name')
        .sort({ createdAt: -1 })
        .lean();

    return NextResponse.json({ success: true, structures });
}

// POST /api/admin/finance/fee-structures — create new
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { program, session: sessionId, semester, total_amount, due_date, description } = body;

    if (!program || !sessionId || !semester || !total_amount || !due_date) {
        return NextResponse.json({ success: false, message: 'All required fields must be provided' }, { status: 400 });
    }

    if (total_amount <= 0) {
        return NextResponse.json({ success: false, message: 'Total amount must be greater than 0' }, { status: 400 });
    }

    await dbConnect();
    const structure = await FeeStructure.create({
        program, session: sessionId, semester, total_amount, due_date, description,
    });

    return NextResponse.json({ success: true, structure }, { status: 201 });
}
