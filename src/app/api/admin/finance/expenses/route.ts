import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Expense } from '@/models/Expense';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';

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

    // Default: never fetch deleted records unless specifically asked (maybe handled in a separate root view)
    const query: Record<string, unknown> = { is_deleted: { $ne: true } };
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

    // Create Audit Log
    await AuditLog.create({
        action: 'CREATE',
        entityType: 'Expense',
        entityId: expense._id,
        performedBy: session.user.id,
        changes: [{ field: 'all', old: null, new: expense.toObject() }],
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
}

// DELETE /api/admin/finance/expenses?id=...
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const reason = searchParams.get('reason') || 'No reason provided';

    if (!id) return NextResponse.json({ success: false, message: 'ID required' }, { status: 400 });

    await dbConnect();

    // Fetch user to check root privilege
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || !currentUser.is_root) {
        return NextResponse.json({
            success: false,
            message: 'Forbidden. Only Root Administrators can delete or cancel financial records.'
        }, { status: 403 });
    }

    const expense = await Expense.findById(id);
    if (!expense) return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });

    if (expense.is_locked) {
        return NextResponse.json({ success: false, message: 'Record is locked for the period and cannot be deleted' }, { status: 403 });
    }

    if (expense.is_deleted) {
        return NextResponse.json({ success: false, message: 'Expense is already soft-deleted' }, { status: 400 });
    }

    // Soft delete
    expense.is_deleted = true;
    expense.deleted_by = session.user.id as any;
    expense.deleted_at = new Date();
    expense.deletion_reason = reason;
    await expense.save();

    // Audit Log
    await AuditLog.create({
        action: 'SOFT_DELETE',
        entityType: 'Expense',
        entityId: expense._id,
        performedBy: session.user.id,
        changes: [{ field: 'is_deleted', old: false, new: true }],
        reason: reason,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, message: 'Expense successfully soft-deleted.' });
}
