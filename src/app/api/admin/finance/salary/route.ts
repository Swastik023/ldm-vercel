import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Salary } from '@/models/Salary';
import { User } from '@/models/User';

// GET /api/admin/finance/salary — list salary records by month
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // "YYYY-MM"
    const status = searchParams.get('status');

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (month) query.month = month;
    if (status) query.status = status;

    const records = await Salary.find(query)
        .populate('employee', 'fullName username role')
        .populate('paid_by', 'fullName')
        .sort({ month: -1, createdAt: -1 })
        .lean();

    const totalPending = records
        .filter((r) => r.status === 'pending')
        .reduce((sum, r) => sum + r.net_amount, 0);

    return NextResponse.json({ success: true, records, totalPending });
}

// POST /api/admin/finance/salary — create salary record(s)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employee, month, base_amount, deductions = 0, remarks } = body;

    if (!employee || !month || !base_amount) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (base_amount <= 0) {
        return NextResponse.json({ success: false, message: 'Base amount must be greater than 0' }, { status: 400 });
    }

    if (deductions < 0 || deductions > base_amount) {
        return NextResponse.json({ success: false, message: 'Deductions must be between 0 and base amount' }, { status: 400 });
    }

    await dbConnect();

    // Check for duplicate
    const exists = await Salary.findOne({ employee, month });
    if (exists) {
        return NextResponse.json({
            success: false,
            message: `Salary for this employee in ${month} already exists`
        }, { status: 409 });
    }

    const net_amount = base_amount - deductions;
    const record = await Salary.create({
        employee, month, base_amount, deductions, net_amount, remarks,
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
}
