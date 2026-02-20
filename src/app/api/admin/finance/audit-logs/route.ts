import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/db';
import { AuditLog } from '@/models/AuditLog';
import { User } from '@/models/User';

// GET /api/admin/finance/audit-logs
// Only accessible by Root Admins
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Verify Root Admin Privilege
    const currentUser = await User.findById(session.user.id);
    if (!currentUser || !currentUser.is_root) {
        return NextResponse.json({
            success: false,
            message: 'Forbidden. Only Root Administrators can view the financial audit ledgers.'
        }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType'); // Optional filter

    const query: Record<string, unknown> = {};
    if (entityType) query.entityType = entityType;

    // Fetch logs, populate who performed it
    const logs = await AuditLog.find(query)
        .populate('performedBy', 'fullName username')
        .sort({ createdAt: -1 })
        .limit(100) // Keep the payload reasonable
        .lean();

    return NextResponse.json({ success: true, logs });
}
