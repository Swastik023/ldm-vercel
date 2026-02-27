import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { StudentFee } from '@/models/StudentFee';
import { Batch, Session } from '@/models/Academic';
import '@/models/Class';

// GET /api/admin/students/export — download all students as CSV
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || session.user.role !== 'admin')
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

        await dbConnect();

        const students = await User.find({ role: 'student' })
            .select('-password')
            .populate('batch', 'name')
            .populate('classId', 'className')
            .sort({ sessionFrom: -1, rollNumber: 1 })
            .lean();

        // Fetch fee summaries for all students
        const studentIds = students.map(s => s._id);
        const allFees = await StudentFee.find({ studentId: { $in: studentIds } }).lean();

        // Build fee map: studentId → { totalFee, amountPaid }
        const feeMap: Record<string, { totalFee: number; amountPaid: number }> = {};
        for (const fee of allFees) {
            const sid = fee.studentId.toString();
            if (!feeMap[sid]) feeMap[sid] = { totalFee: 0, amountPaid: 0 };
            feeMap[sid].totalFee += fee.totalFee;
            feeMap[sid].amountPaid += fee.amountPaid;
        }

        // Build CSV
        const headers = [
            'Roll No', 'Full Name', 'Email', 'Phone', 'Username',
            'Class', 'Batch', 'Session From', 'Session To',
            'Status', 'Profile Complete', 'Provider', 'Registered On',
            'Total Fee (₹)', 'Amount Paid (₹)', 'Amount Left (₹)',
        ];

        const rows = students.map(s => {
            const sid = s._id.toString();
            const fee = feeMap[sid] || { totalFee: 0, amountPaid: 0 };
            const left = Math.max(0, fee.totalFee - fee.amountPaid);
            return [
                s.rollNumber || '',
                s.fullName || '',
                s.email || '',
                (s as any).mobileNumber || '',
                s.username || '',
                (s.classId as any)?.className || '',
                (s.batch as any)?.name || '',
                (s as any).sessionFrom || '',
                (s as any).sessionTo || '',
                s.status || '',
                s.isProfileComplete ? 'Yes' : 'No',
                (s as any).provider || 'credentials',
                new Date(s.createdAt as Date).toLocaleDateString('en-IN'),
                fee.totalFee,
                fee.amountPaid,
                left,
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });

        const csv = [headers.map(h => `"${h}"`).join(','), ...rows].join('\n');

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
    }
}
