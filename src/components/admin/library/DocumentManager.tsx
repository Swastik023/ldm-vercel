'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Plus, FileText, Download, Trash2, Edit, History } from 'lucide-react';
import dynamic from 'next/dynamic';

const DocumentUploadModal = dynamic<any>(() => import('./DocumentUploadModal'), { ssr: false });
const VersionHistoryModal = dynamic<any>(() => import('./VersionHistoryModal'), { ssr: false });

export default function DocumentManager({
    initialDocuments,
    categories,
    programs
}: {
    initialDocuments: any[],
    categories: any[],
    programs: any[]
}) {
    const [documents, setDocuments] = useState(initialDocuments);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<any>(null); // Null if new upload, object if editing

    const handleUploadComplete = (newDoc: any, isEdit: boolean) => {
        if (isEdit) {
            setDocuments(docs => docs.map(d => d._id === newDoc._id ? newDoc : d));
        } else {
            setDocuments([newDoc, ...documents]);
        }
        setIsUploadOpen(false);
        setSelectedDoc(null);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to soft-delete this document? It will be archived.')) return;

        try {
            const res = await fetch(`/api/admin/library/documents/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Document archived');
                setDocuments(docs => docs.filter(d => d._id !== id));
            } else {
                toast.error(data.message);
            }
        } catch (e) {
            toast.error('Network error. Failed to delete.');
        }
    };

    const openEdit = (doc: any) => {
        setSelectedDoc(doc);
        setIsUploadOpen(true);
    };

    const openHistory = (doc: any) => {
        setSelectedDoc(doc);
        setIsHistoryOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <Button onClick={() => { setSelectedDoc(null); setIsUploadOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Upload Document
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase font-medium">
                                <tr>
                                    <th className="px-6 py-3">Document</th>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3">Course / Scope</th>
                                    <th className="px-6 py-3">Version</th>
                                    <th className="px-6 py-3">Type</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {documents.map((doc) => (
                                    <tr key={doc._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-6 w-6 text-indigo-500" />
                                                <div className="font-medium text-gray-900">{doc.title}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-600">
                                            {doc.category_id?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {doc.is_common ? (
                                                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">All Courses</span>
                                            ) : (
                                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">{doc.course_id?.code || 'Invalid Course'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-purple-100 text-purple-800 font-mono text-xs font-bold px-2 py-1 rounded">
                                                v{doc.current_version}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 uppercase text-xs font-bold text-gray-400">
                                            {doc.file_type}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button onClick={() => openHistory(doc)} className="text-gray-500 hover:text-gray-900" title="Version History">
                                                <History className="h-4 w-4 inline" />
                                            </button>
                                            <button onClick={() => openEdit(doc)} className="text-blue-500 hover:text-blue-700" title="Edit / Upload New Version">
                                                <Edit className="h-4 w-4 inline" />
                                            </button>
                                            {doc.file_path && (
                                                <a href={doc.file_path} target="_blank" rel="noreferrer" className="text-green-500 hover:text-green-700" title="Download Current">
                                                    <Download className="h-4 w-4 inline" />
                                                </a>
                                            )}
                                            <button onClick={() => handleDelete(doc._id)} className="text-red-500 hover:text-red-700" title="Archive Document">
                                                <Trash2 className="h-4 w-4 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {documents.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500">
                                            No study resources uploaded yet. Get started!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {isUploadOpen && (
                <DocumentUploadModal
                    isOpen={isUploadOpen}
                    onClose={() => { setIsUploadOpen(false); setSelectedDoc(null); }}
                    onSuccess={handleUploadComplete}
                    categories={categories}
                    programs={programs}
                    existingDoc={selectedDoc}
                />
            )}

            {isHistoryOpen && selectedDoc && (
                <VersionHistoryModal
                    isOpen={isHistoryOpen}
                    onClose={() => { setIsHistoryOpen(false); setSelectedDoc(null); }}
                    documentId={selectedDoc._id}
                    documentTitle={selectedDoc.title}
                />
            )}
        </div>
    );
}
