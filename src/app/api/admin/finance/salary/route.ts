import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { Salary } from '@/models/Salary';
import { AuditLog } from '@/models/AuditLog';
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

    // Default: never fetch deleted records unless specifically asked
    const query: Record<string, unknown> = { is_deleted: { $ne: true } };
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

    // Create Audit Log
    await AuditLog.create({
        action: 'CREATE',
        entityType: 'Salary',
        entityId: record._id,
        performedBy: session.user.id,
        changes: [{ field: 'all', old: null, new: record.toObject() }],
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, record }, { status: 201 });
}

// DELETE /api/admin/finance/salary?id=...
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

    const salary = await Salary.findById(id);
    if (!salary) return NextResponse.json({ success: false, message: 'Salary not found' }, { status: 404 });

    if (salary.is_locked) {
        return NextResponse.json({ success: false, message: 'Record is locked for the period and cannot be deleted' }, { status: 403 });
    }

    if (salary.is_deleted) {
        return NextResponse.json({ success: false, message: 'Salary is already soft-deleted' }, { status: 400 });
    }

    // Soft delete
    salary.is_deleted = true;
    salary.deleted_by = session.user.id as any;
    salary.deleted_at = new Date();
    salary.deletion_reason = reason;
    await salary.save();

    // Audit Log
    await AuditLog.create({
        action: 'SOFT_DELETE',
        entityType: 'Salary',
        entityId: salary._id,
        performedBy: session.user.id,
        changes: [{ field: 'is_deleted', old: false, new: true }],
        reason: reason,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, message: 'Salary successfully soft-deleted.' });
}
