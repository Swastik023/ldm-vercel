'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { X, Upload, File as FileIcon } from 'lucide-react';

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
    const [filePath, setFilePath] = useState(existingDoc?.file_path || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setUploading(true);

        let finalFilePath = filePath;

        // 1. Handle File Upload if a new file is selected
        if (selectedFile) {
            try {
                const formData = new FormData();
                formData.append('file', selectedFile);
                const uploadRes = await fetch('/api/admin/library/upload', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.success) {
                    finalFilePath = uploadData.url;
                } else {
                    toast.error('File upload failed: ' + uploadData.message);
                    setUploading(false);
                    return;
                }
            } catch (err) {
                toast.error('Network error during file upload');
                setUploading(false);
                return;
            }
        }

        const payload = {
            title, category_id: categoryId, is_common: isCommon, course_id: courseId,
            file_type: fileType, content, file_path: finalFilePath
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
                                <option value="md">Markdown Document (.md)</option>
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
                    ) : fileType === 'md' ? (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Markdown Content (Raw Text)</label>
                            <textarea
                                className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder="# Title\n\nContent here..."
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="text-sm font-medium mb-2 block">Upload File (PDF / DOCX / XLSX / MD)</label>
                            <div className="flex items-center justify-center w-full">
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {selectedFile ? (
                                            <>
                                                <FileIcon className="w-8 h-8 mb-4 text-indigo-500" />
                                                <p className="text-sm text-gray-700 font-medium truncate max-w-[200px]">{selectedFile.name}</p>
                                                <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-8 h-8 mb-4 text-gray-500" />
                                                <p className="mb-2 text-sm text-gray-500 font-semibold text-center">Click to upload or drag and drop</p>
                                                <p className="text-xs text-gray-400">PDF, DOCX, PPTX, XLSX or MD (Max 10MB)</p>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={e => {
                                            const file = e.target.files?.[0] || null;
                                            setSelectedFile(file);
                                            if (file) {
                                                const ext = file.name.split('.').pop()?.toLowerCase();
                                                const matchesMD = ext === 'md' || ext === 'markdown';

                                                if (matchesMD) {
                                                    setFileType('md');
                                                    // Automatically read the MD file content for the reader
                                                    const reader = new FileReader();
                                                    reader.onload = (event) => {
                                                        const text = event.target?.result as string;
                                                        if (text) setContent(text);
                                                    };
                                                    reader.readAsText(file);
                                                }
                                                else if (ext === 'pdf') setFileType('pdf');
                                                else if (ext === 'docx' || ext === 'doc') setFileType('docx');
                                                else if (ext === 'xlsx' || ext === 'xls') setFileType('xlsx');
                                                else if (ext === 'pptx' || ext === 'ppt') setFileType('pptx');
                                            }
                                        }}
                                        accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.md"
                                    />
                                </label>
                            </div>
                            {filePath && !selectedFile && (
                                <p className="text-xs text-indigo-600 mt-2 font-medium">Currently attached: {filePath.split('/').pop()}</p>
                            )}
                            <div className="mt-4">
                                <label className="text-sm font-medium mb-2 block">Direct URL (Optional Fallback)</label>
                                <Input
                                    value={filePath}
                                    onChange={e => setFilePath(e.target.value)}
                                    placeholder="https://google.drive/..."
                                />
                            </div>
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
