import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CategoryManager from '@/components/admin/library/CategoryManager';
import dbConnect from '@/lib/db';
import { LibraryCategory } from '@/models/LibraryCategory';

export const dynamic = 'force-dynamic';

export default async function LibraryCategoriesPage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') redirect('/login');

    await dbConnect();
    const categories = await LibraryCategory.find().sort({ createdAt: -1 }).lean();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Library Categories</h1>
                    <p className="text-muted-foreground">Manage organizational folders for digital resources.</p>
                </div>
            </div>
            <CategoryManager initialCategories={JSON.parse(JSON.stringify(categories))} />
        </div>
    );
}
