export const dynamic = 'force-dynamic';
import NoticesManager from '@/components/admin/NoticesManager';
import { getNotices } from '@/actions/notice';



export default async function NoticesPage() {
    const { data: notices } = await getNotices();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Manage Notices</h1>
            </div>
            <NoticesManager initialNotices={notices || []} />
        </div>
    );
}
