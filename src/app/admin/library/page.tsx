export const dynamic = 'force-dynamic';
import LibraryManager from '@/components/admin/LibraryManager';
import { getDocuments } from '@/actions/library';

export default async function LibraryPage() {
    const { data } = await getDocuments();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">E-Library</h1>
                <p className="text-muted-foreground">Manage digital resources and study materials.</p>
            </div>
            <LibraryManager
                initialDocuments={data?.documents || []}
                stats={data?.stats || {}}
            />
        </div>
    );
}
