export const dynamic = 'force-dynamic';
import AssignmentManager from '@/components/admin/AssignmentManager';
import { getAssignments, getPrograms, getSessions, getBatches, getSubjects } from '@/actions/academic';
import { User } from '@/models/User'; // We need to fetch teachers.
import dbConnect from '@/lib/db'; // Direct DB call for teachers if no action exists

async function getTeachers() {
    await dbConnect();
    const teachers = await User.find({ role: 'teacher' }).select('fullName username _id');
    return JSON.parse(JSON.stringify(teachers));
}

export default async function AssignmentsPage() {
    const { data: assignments } = await getAssignments(); // Gets all, might be heavy, but okay for MVP
    const { data: programs } = await getPrograms();
    const { data: sessions } = await getSessions();
    const { data: batches } = await getBatches();
    const { data: subjects } = await getSubjects();
    const teachers = await getTeachers();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Teacher Assignments</h1>
                <p className="text-muted-foreground">Assign teachers to subjects and sections.</p>
            </div>
            <AssignmentManager
                initialAssignments={assignments || []}
                programs={programs || []}
                sessions={sessions || []}
                batches={batches || []}
                subjects={subjects || []}
                teachers={teachers || []}
            />
        </div>
    );
}
