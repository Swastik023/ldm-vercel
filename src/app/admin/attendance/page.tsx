export const dynamic = 'force-dynamic';
import AttendanceManager from '@/components/admin/AttendanceManager';
import { getSubjects } from '@/actions/academic';

export default async function AttendancePage() {
    const { data: subjects } = await getSubjects();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Attendance Review</h1>
                <p className="text-muted-foreground">Review and manage student attendance records.</p>
            </div>
            <AttendanceManager subjects={subjects || []} />
        </div>
    );
}
