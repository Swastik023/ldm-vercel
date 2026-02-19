'use client';

import { useState } from 'react';
import { createGalleryImage, deleteGalleryImage, uploadImage } from '@/actions/gallery';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Trash2, Upload } from 'lucide-react';

interface GalleryImage {
    _id: string;
    title: string;
    imageUrl: string;
    category: string;
}

export default function GalleryManager({ initialImages }: { initialImages: GalleryImage[] }) {
    const [images, setImages] = useState<GalleryImage[]>(initialImages);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('general');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select an image');
            return;
        }
        setIsLoading(true);

        try {
            // 1. Upload Image
            const formData = new FormData();
            formData.append('image', file);
            const uploadResult = await uploadImage(formData);

            if (!uploadResult.success) {
                throw new Error(uploadResult.error);
            }

            // 2. Create Record
            const result = await createGalleryImage({
                title,
                category,
                imageUrl: uploadResult.url
            });

            if (result.success) {
                toast.success('Image uploaded successfully');
                setTitle('');
                setFile(null);
                // Reset file input if possible
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                setImages([result.data, ...images]);
            } else {
                toast.error('Failed to save image details');
            }
        } catch (error: any) {
            toast.error(error.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;

        try {
            const result = await deleteGalleryImage(id);
            if (result.success) {
                toast.success('Image deleted');
                setImages(images.filter(img => img._id !== id));
            } else {
                toast.error('Failed to delete image');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Input
                                placeholder="Image Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <option value="general">General</option>
                                <option value="campus">Campus</option>
                                <option value="events">Events</option>
                                <option value="students">Students</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-4">
                            <Input
                                id="file-upload"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="cursor-pointer"
                            />
                            <Button type="submit" isLoading={isLoading}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img) => (
                    <div key={img._id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
                        <img
                            src={img.imageUrl}
                            alt={img.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center text-white">
                            <span className="text-sm truncate font-medium">{img.title}</span>
                            <button
                                onClick={() => handleDelete(img._id)}
                                className="text-red-400 hover:text-red-300 p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {images.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No images in gallery.
                    </div>
                )}
            </div>
        </div>
    );
}
