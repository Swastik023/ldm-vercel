export const dynamic = 'force-dynamic';
import GalleryManager from '@/components/admin/GalleryManager';
import { getGalleryImages } from '@/actions/gallery';



export default async function GalleryPage() {
    const { data: images } = await getGalleryImages();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Gallery Manager</h1>
            </div>
            <GalleryManager initialImages={images || []} />
        </div>
    );
}
