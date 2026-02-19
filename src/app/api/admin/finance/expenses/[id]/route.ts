import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Expense } from '@/models/Expense';

// PUT /api/admin/finance/expenses/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await dbConnect();
    const updated = await Expense.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    if (!updated) {
        return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, expense: updated });
}

// DELETE /api/admin/finance/expenses/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const deleted = await Expense.findByIdAndDelete(id);
    if (!deleted) {
        return NextResponse.json({ success: false, message: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Expense deleted' });
}
