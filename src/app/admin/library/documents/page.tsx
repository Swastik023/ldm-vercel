import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DocumentManager from '@/components/admin/library/DocumentManager';
import dbConnect from '@/lib/db';
import { LibraryDocument } from '@/models/LibraryDocument';
import { LibraryCategory } from '@/models/LibraryCategory';
import { Program } from '@/models/Academic';

export const dynamic = 'force-dynamic';

export default async function LibraryDocumentsPage() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') redirect('/login');

    await dbConnect();

    // Fetch dependencies for dropdowns
    const categories = await LibraryCategory.find().sort({ name: 1 }).lean();
    const programs = await Program.find({ is_active: true }).sort({ name: 1 }).lean();

    // Fetch all active documents populated
    const documents = await LibraryDocument.find({ is_deleted: { $ne: true } })
        .populate('course_id', 'name code course_type')
        .populate('category_id', 'name semester_or_module')
        .sort({ updatedAt: -1 })
        .lean();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">E-Library Documents</h1>
                    <p className="text-muted-foreground">Manage files, rich-text syllabi, and structural versions.</p>
                </div>
            </div>

            <DocumentManager
                initialDocuments={JSON.parse(JSON.stringify(documents))}
                categories={JSON.parse(JSON.stringify(categories))}
                programs={JSON.parse(JSON.stringify(programs))}
            />
        </div>
    );
}
