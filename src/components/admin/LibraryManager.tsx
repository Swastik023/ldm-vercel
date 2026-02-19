'use client';

import { useState } from 'react';
import { uploadDocument, deleteDocument } from '@/actions/library';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Trash2, FileText, Upload } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LibraryManager({ initialDocuments, stats }: any) {
    const [documents, setDocuments] = useState<any[]>(initialDocuments);
    const [uploading, setUploading] = useState(false);
    const { user } = useAuth(); // Need user ID for upload

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('general');
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !user) return;
        setUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('category', category);
        // formData.append('userId', user._id); // Assuming server side extracts from session or we pass it?
        // Actions don't effectively get client-side context unless passed. 
        // Best practice is to use session on server. But here `uploadDocument` takes `userId` as param.
        // We'll pass it.

        try {
            const result = await uploadDocument(formData, user.id); // Pass user ID
            if (result.success) {
                toast.success('Document uploaded');
                setDocuments([result.data, ...documents]);
                setTitle('');
                setFile(null);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const result = await deleteDocument(id);
            if (result.success) {
                toast.success('Document deleted');
                setDocuments(documents.filter(d => d._id !== id));
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Delete failed');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-6">
                        <h3 className="text-blue-700 font-semibold uppercase text-xs">Total Documents</h3>
                        <p className="text-3xl font-bold text-blue-900 mt-2">{documents.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-6">
                        <h3 className="text-green-700 font-semibold uppercase text-xs">Total Storage</h3>
                        <p className="text-3xl font-bold text-green-900 mt-2">{((stats.total_size || 0) / 1024 / 1024).toFixed(2)} MB</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1">
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="font-semibold text-lg mb-4">Upload Document</h3>
                            <form onSubmit={handleUpload} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                        placeholder="Document Title"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Category</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="general">General</option>
                                        <option value="syllabus">Syllabus</option>
                                        <option value="paper">Paper</option>
                                        <option value="book">Book</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">PDF File</label>
                                    <Input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        required
                                    />
                                </div>
                                <Button type="submit" isLoading={uploading} className="w-full">
                                    <Upload className="mr-2 h-4 w-4" /> Upload
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardContent className="p-0">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                                    <tr>
                                        <th className="px-6 py-3">Document</th>
                                        <th className="px-6 py-3">Category</th>
                                        <th className="px-6 py-3">Size</th>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {documents.map((doc) => (
                                        <tr key={doc._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-8 w-8 text-red-500" />
                                                    <div>
                                                        <div className="font-medium text-gray-900">{doc.title}</div>
                                                        <a href={doc.url} target="_blank" className="text-blue-600 text-xs hover:underline">View PDF</a>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs uppercase font-bold">{doc.category}</span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {(doc.file_size / 1024).toFixed(0)} KB
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(doc.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(doc._id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {documents.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-10 text-gray-500">
                                                No documents in library.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
