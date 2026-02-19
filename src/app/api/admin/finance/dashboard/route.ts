import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { FeePayment } from '@/models/FeePayment';
import { FeeStructure } from '@/models/FeeStructure';
import { Expense } from '@/models/Expense';
import { Salary } from '@/models/Salary';
// Must import Academic models so Mongoose registers Program/Session before populate()
import '@/models/Academic';

// GET /api/admin/finance/dashboard — all summary stats
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // --- Revenue: sum of all payments made ---
    const revenueAgg = await FeePayment.aggregate([
        { $group: { _id: null, total: { $sum: '$amount_paid' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    // --- Pending fees: sum of (total_amount - amount_paid) for unpaid/partial ---
    const pendingPayments = await FeePayment.find({ status: { $in: ['unpaid', 'partial'] } })
        .populate('fee_structure', 'total_amount')
        .lean();

    const totalPendingFees = pendingPayments.reduce((sum, p) => {
        const fs = (p.fee_structure as unknown) as { total_amount: number } | null;
        return sum + (fs?.total_amount ?? 0) - p.amount_paid;
    }, 0);

    // --- Expenses ---
    const expenseAgg = await Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalExpenses = expenseAgg[0]?.total ?? 0;

    // --- Salary (paid) ---
    const salaryAgg = await Salary.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$net_amount' } } }
    ]);
    const totalSalaryPaid = salaryAgg[0]?.total ?? 0;

    // --- Pending salaries ---
    const pendingSalaryAgg = await Salary.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$net_amount' } } }
    ]);
    const totalSalaryPending = pendingSalaryAgg[0]?.total ?? 0;

    // --- Net balance ---
    const totalSpend = totalExpenses + totalSalaryPaid;
    const netBalance = totalRevenue - totalSpend;

    // --- Monthly revenue (last 6 months) for chart ---
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Fee payments have individual transactions inside payments[] array, aggregate those
    const monthlyRevenue = await FeePayment.aggregate([
        { $unwind: '$payments' },
        { $match: { 'payments.paid_on': { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: {
                    year: { $year: '$payments.paid_on' },
                    month: { $month: '$payments.paid_on' }
                },
                total: { $sum: '$payments.amount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthlyExpenses = await Expense.aggregate([
        { $match: { paid_on: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { year: { $year: '$paid_on' }, month: { $month: '$paid_on' } },
                total: { $sum: '$amount' }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // --- Top 5 pending payments for the dashboard table ---
    const pendingTop5 = await FeePayment.find({ status: { $in: ['unpaid', 'partial'] } })
        .populate('student', 'fullName username')
        .populate({ path: 'fee_structure', select: 'total_amount description semester', populate: { path: 'program', select: 'name' } })
        .sort({ updatedAt: 1 })
        .limit(5)
        .lean();

    return NextResponse.json({
        success: true,
        stats: {
            totalRevenue,
            totalExpenses,
            totalSalaryPaid,
            totalSpend,
            netBalance,
            totalPendingFees,
            totalSalaryPending,
        },
        charts: { monthlyRevenue, monthlyExpenses },
        pendingTop5,
    });
}
