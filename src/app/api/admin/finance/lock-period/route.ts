import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Expense } from '@/models/Expense';
import { Salary } from '@/models/Salary';
import { FeePayment } from '@/models/FeePayment';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';

// POST /api/admin/finance/lock-period
// Allows Root Admin to freeze all financial records before a certain date
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { lockDate } = body;

    if (!lockDate) {
        return NextResponse.json({ success: false, message: 'Lock Date required' }, { status: 400 });
    }

    const cutoffDate = new Date(lockDate);

    await dbConnect();

    // Verify Root Admin
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || !currentUser.is_root) {
        return NextResponse.json({
            success: false,
            message: 'Forbidden. Only Root Administrators can lock financial periods.'
        }, { status: 403 });
    }

    // Lock Expenses
    await Expense.updateMany(
        { paid_on: { $lte: cutoffDate }, is_locked: false },
        { $set: { is_locked: true, locked_by: session.user.id, locked_at: new Date() } }
    );

    // Lock Salaries (using createdAt as proxy for period if paid_on is null, otherwise paid_on)
    await Salary.updateMany(
        {
            $or: [
                { paid_on: { $lte: cutoffDate } },
                { createdAt: { $lte: cutoffDate } }
            ],
            is_locked: false
        },
        { $set: { is_locked: true, locked_by: session.user.id, locked_at: new Date() } }
    );

    // Lock Fee Payments
    // We lock the entire payment document based on when the sub-payments were made
    const feePayments = await FeePayment.find({
        is_locked: false,
        'payments.paid_on': { $lte: cutoffDate }
    });

    for (const fp of feePayments) {
        // Technically we might only want to lock specific sub-transactions, but for simplicity
        // in this model, we freeze the root FeePayment if its last payment is old.
        // A better approach in a real ERP is to only lock the nested array elements.
        fp.is_locked = true;
        fp.locked_by = session.user.id as any;
        fp.locked_at = new Date();
        await fp.save();
    }

    // Create Audit Log of the action itself
    await AuditLog.create({
        action: 'LOCK',
        entityType: 'FeeStructure', // Using this generically for the system
        entityId: currentUser._id, // Attach to the user who locked it
        performedBy: session.user.id,
        changes: [{ field: 'System Lock', old: null, new: cutoffDate }],
        reason: 'Period End Closing',
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({
        success: true,
        message: `All financial records up to ${cutoffDate.toDateString()} have been permanently locked.`
    });
}
