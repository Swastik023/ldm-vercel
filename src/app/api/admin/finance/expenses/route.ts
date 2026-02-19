import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Expense } from '@/models/Expense';

// GET /api/admin/finance/expenses
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const month = searchParams.get('month'); // "YYYY-MM"

    await dbConnect();

    const query: Record<string, unknown> = {};
    if (category) query.category = category;
    if (month) {
        const [year, m] = month.split('-').map(Number);
        const start = new Date(year, m - 1, 1);
        const end = new Date(year, m, 0, 23, 59, 59);
        query.paid_on = { $gte: start, $lte: end };
    }

    const expenses = await Expense.find(query)
        .populate('recorded_by', 'fullName')
        .sort({ paid_on: -1 })
        .lean();

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return NextResponse.json({ success: true, expenses, total });
}

// POST /api/admin/finance/expenses
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, amount, category, paid_on, paid_to, remarks } = body;

    if (!title || !amount || !category || !paid_on || !paid_to) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0) {
        return NextResponse.json({ success: false, message: 'Amount must be greater than 0' }, { status: 400 });
    }

    await dbConnect();
    const expense = await Expense.create({
        title, amount, category, paid_on: new Date(paid_on), paid_to, remarks,
        recorded_by: session.user.id,
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
}
