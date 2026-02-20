import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeePayment } from '@/models/FeePayment';
import { FeeStructure } from '@/models/FeeStructure';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';
import '@/models/Academic'; // registers Program & Session for populate()


// GET /api/admin/finance/payments/[studentId] — student's full payment history
export async function GET(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    await dbConnect();

    const payments = await FeePayment.find({ student: studentId, is_deleted: { $ne: true } })
        .populate({
            path: 'fee_structure',
            select: 'total_amount semester description due_date program session',
            populate: [
                { path: 'program', select: 'name code' },
                { path: 'session', select: 'name' },
            ],
        })
        .lean();

    // Add remaining balance to each payment
    const enriched = payments.map((p) => {
        const fs = (p.fee_structure as unknown) as { total_amount: number } | null;
        const total = fs?.total_amount ?? 0;
        const remaining = total - p.amount_paid;
        return { ...p, remaining };
    });

    return NextResponse.json({ success: true, payments: enriched });
}

// POST /api/admin/finance/payments/[studentId] — add a payment entry
export async function POST(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { studentId } = await params;
    const body = await req.json();
    const { fee_structure_id, amount, mode, receipt_no, paid_on, remarks } = body;

    if (!fee_structure_id || !amount || !mode || !receipt_no || !paid_on) {
        return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    if (amount <= 0) {
        return NextResponse.json({ success: false, message: 'Amount must be greater than 0' }, { status: 400 });
    }

    await dbConnect();

    const feeStructure = await FeeStructure.findById(fee_structure_id);
    if (!feeStructure) {
        return NextResponse.json({ success: false, message: 'Fee structure not found' }, { status: 404 });
    }

    // Get or create FeePayment document
    let feePayment = await FeePayment.findOne({ student: studentId, fee_structure: fee_structure_id });
    if (!feePayment) {
        feePayment = await FeePayment.create({
            student: studentId,
            fee_structure: fee_structure_id,
            amount_paid: 0,
            payments: [],
            status: 'unpaid',
        });
    }

    // Validate overpayment
    const remaining = feeStructure.total_amount - feePayment.amount_paid;
    if (amount > remaining) {
        return NextResponse.json({
            success: false,
            message: `Amount exceeds remaining balance (₹${remaining})`
        }, { status: 400 });
    }

    // Add payment transaction
    const newAmountPaid = feePayment.amount_paid + amount;
    let newStatus: 'unpaid' | 'partial' | 'paid' = 'partial';
    if (newAmountPaid === 0) newStatus = 'unpaid';
    else if (newAmountPaid >= feeStructure.total_amount) newStatus = 'paid';

    const updated = await FeePayment.findByIdAndUpdate(
        feePayment._id,
        {
            $push: {
                payments: {
                    amount,
                    paid_on: new Date(paid_on),
                    mode,
                    receipt_no,
                    remarks: remarks || '',
                    recorded_by: session.user.id,
                }
            },
            $set: {
                amount_paid: newAmountPaid,
                status: newStatus,
            }
        },
        { new: true }
    );

    // Create Audit Log for the new payment added
    if (updated) {
        // Find the newly added payment record
        const newRecord = updated.payments[updated.payments.length - 1];
        await AuditLog.create({
            action: 'UPDATE',
            entityType: 'FeePayment',
            entityId: updated._id,
            performedBy: session.user.id,
            changes: [{ field: 'payments (array addition)', old: null, new: newRecord }],
            reason: remarks || 'Initial payment entry',
            ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
        });
    }

    return NextResponse.json({ success: true, payment: updated }, { status: 201 });
}

// DELETE /api/admin/finance/payments/[studentId]?paymentRecordId=...
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ studentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentRecordId = searchParams.get('paymentRecordId'); // The ID of the specific payment inside the array
    const feePaymentId = searchParams.get('feePaymentId'); // The parent FeePayment Mongo ID
    const reason = searchParams.get('reason') || 'No reason provided';

    if (!paymentRecordId || !feePaymentId) {
        return NextResponse.json({ success: false, message: 'Both paymentRecordId and feePaymentId are required' }, { status: 400 });
    }

    await dbConnect();

    // Verify Root Admin Privilege
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || !currentUser.is_root) {
        return NextResponse.json({
            success: false,
            message: 'Forbidden. Only Root Administrators can delete or cancel financial records.'
        }, { status: 403 });
    }

    // Find the Master FeePayment Document
    const feePayment = await FeePayment.findById(feePaymentId);
    if (!feePayment) return NextResponse.json({ success: false, message: 'Fee record not found' }, { status: 404 });

    if (feePayment.is_locked) {
        return NextResponse.json({ success: false, message: 'Record is locked for the period and cannot be modified' }, { status: 403 });
    }

    // Find the exact nested payment
    const paymentIndex = feePayment.payments.findIndex(p => p._id && (p._id as any).toString() === paymentRecordId);
    if (paymentIndex === -1) {
        return NextResponse.json({ success: false, message: 'Specific sub-payment transaction not found' }, { status: 404 });
    }

    const cancelledPaymentObj = (feePayment.payments[paymentIndex] as any).toObject();

    // Withdraw the amount
    feePayment.amount_paid -= feePayment.payments[paymentIndex].amount;
    if (feePayment.amount_paid < 0) feePayment.amount_paid = 0; // Sanity protection

    // Remove from array 
    feePayment.payments.splice(paymentIndex, 1);

    // Re-check status against total structure using populate
    await feePayment.populate('fee_structure');
    const fsTotal = (feePayment.fee_structure as any)?.total_amount || 0;

    let newStatus: 'paid' | 'partial' | 'unpaid' = 'partial';
    if (feePayment.amount_paid >= fsTotal && fsTotal > 0) newStatus = 'paid';
    else if (feePayment.amount_paid <= 0) newStatus = 'unpaid';

    feePayment.status = newStatus;
    await feePayment.save();

    // Create Audit Log for deletion
    await AuditLog.create({
        action: 'SOFT_DELETE',
        entityType: 'FeePayment',
        entityId: feePayment._id,
        performedBy: session.user.id,
        changes: [{ field: 'payments (array deletion/cancellation)', old: cancelledPaymentObj, new: null }],
        reason: reason,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1'
    });

    return NextResponse.json({ success: true, message: 'Payment successfully cancelled and audited.' });
}
