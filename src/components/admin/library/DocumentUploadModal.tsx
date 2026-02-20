'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';

export default function DocumentUploadModal({
    isOpen, onClose, onSuccess, categories, programs, existingDoc
}: {
    isOpen: boolean; onClose: () => void; onSuccess: (doc: any, isEdit: boolean) => void;
    categories: any[]; programs: any[]; existingDoc?: any;
}) {
    const isEdit = !!existingDoc;
    // Base configuration state
    const [title, setTitle] = useState(existingDoc?.title || '');
    const [categoryId, setCategoryId] = useState(existingDoc?.category_id?._id || existingDoc?.category_id || '');
    const [isCommon, setIsCommon] = useState(existingDoc?.is_common || false);
    const [courseId, setCourseId] = useState(existingDoc?.course_id?._id || existingDoc?.course_id || '');
    const [fileType, setFileType] = useState(existingDoc?.file_type || 'pdf');

    // Data state
    const [content, setContent] = useState(existingDoc?.content || '');
    const [filePath, setFilePath] = useState(existingDoc?.file_path || ''); // Simple URL for now, expand to Cloudinary upload later
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        const payload = {
            title, category_id: categoryId, is_common: isCommon, course_id: courseId,
            file_type: fileType, content, file_path: filePath
        };

        try {
            const url = isEdit ? `/api/admin/library/documents/${existingDoc._id}` : `/api/admin/library/documents`;
            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (data.success) {
                toast.success(isEdit ? 'New version created!' : 'Document uploaded successfully!');

                // Keep the populated objects intact for UI reactivity
                const augmentedDoc = {
                    ...data.document,
                    category_id: categories.find(c => c._id === categoryId) || data.document.category_id,
                    course_id: programs.find(p => p._id === courseId) || data.document.course_id
                };

                onSuccess(augmentedDoc, isEdit);
            } else {
                toast.error(data.message || 'Action failed');
            }
        } catch (err) {
            toast.error('Network Error during document transmission');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold">{isEdit ? `Upload New Version of "${existingDoc.title}"` : 'Upload New Document'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium">Document Title</label>
                            <Input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Anatomy Syllabus V1" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Category</label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={categoryId} onChange={e => setCategoryId(e.target.value)} required disabled={isEdit}>
                                <option value="">Select Folder...</option>
                                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>

                        {!isEdit && (
                            <>
                                <div className="flex items-center space-x-2 mt-6">
                                    <input type="checkbox" id="common" checked={isCommon} onChange={e => setIsCommon(e.target.checked)} className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" />
                                    <label htmlFor="common" className="text-sm font-medium">Is Common Material? (Applies to all courses)</label>
                                </div>
                                {!isCommon && (
                                    <div>
                                        <label className="text-sm font-medium">Link to Course</label>
                                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={courseId} onChange={e => setCourseId(e.target.value)} required={!isCommon}>
                                            <option value="">Select Program...</option>
                                            {programs.map(p => <option key={p._id} value={p._id}>{p.code} - {p.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}

                        <div>
                            <label className="text-sm font-medium">Format</label>
                            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={fileType} onChange={e => setFileType(e.target.value)} required>
                                <option value="pdf">PDF File</option>
                                <option value="docx">Word Document (.docx)</option>
                                <option value="pptx">PowerPoint (.pptx)</option>
                                <option value="xlsx">Excel (.xlsx)</option>
                                <option value="rich-text">Rich Text Editor</option>
                            </select>
                        </div>
                    </div>

                    <hr className="my-2" />

                    {fileType === 'rich-text' ? (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Document Content (Rich Text / HTML)</label>
                            <textarea
                                className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="<h1>Title</h1> <p>Content here...</p>"
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Direct Upload Link (Google Drive / Cloudinary)</label>
                            <Input value={filePath} onChange={e => setFilePath(e.target.value)} required placeholder="https://..." />
                            <p className="text-xs text-muted-foreground mt-2">Note: To minimize VPS storage, documents are stored via external CDN links. Paste the secure static URL here.</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={uploading}>{isEdit ? 'Push Version Update' : 'Publish Document'}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
