export const dynamic = 'force-dynamic';
import BatchManager from '@/components/admin/BatchManager';
import { getBatches, getPrograms, getSessions } from '@/actions/academic';

export default async function BatchesPage() {
    const { data: batches } = await getBatches();
    const { data: programs } = await getPrograms();
    const { data: sessions } = await getSessions();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Batch Management</h1>
                <p className="text-muted-foreground">Manage student batches and sections.</p>
            </div>
            <BatchManager
                initialBatches={batches || []}
                programs={programs || []}
                sessions={sessions || []}
            />
        </div>
    );
}
