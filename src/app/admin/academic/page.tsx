export const dynamic = 'force-dynamic';
import AcademicTabs from '@/components/admin/AcademicTabs';
import { getPrograms, getSessions, getSubjects } from '@/actions/academic';

export default async function AcademicPage() {
    const { data: programs } = await getPrograms();
    const { data: sessions } = await getSessions();
    const { data: subjects } = await getSubjects();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Academic Management</h1>
                <p className="text-muted-foreground">Manage programs, sessions, subjects and configuration.</p>
            </div>

            <AcademicTabs
                programs={programs || []}
                sessions={sessions || []}
                subjects={subjects || []}
            />
        </div>
    );
}
