'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { X, ExternalLink, Clock, User } from 'lucide-react';

export default function VersionHistoryModal({
    isOpen, onClose, documentId, documentTitle
}: {
    isOpen: boolean; onClose: () => void; documentId: string; documentTitle: string;
}) {
    const [versions, setVersions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        fetch(`/api/admin/library/documents/${documentId}/versions`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setVersions(data.versions);
                else toast.error(data.message || 'Failed to load versions');
            })
            .catch(() => toast.error('Network Error'))
            .finally(() => setLoading(false));
    }, [isOpen, documentId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Version History</h2>
                        <p className="text-sm text-gray-500 mt-1">Audit trail for: <span className="font-semibold text-gray-700">{documentTitle}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="h-5 w-5 text-gray-600" /></button>
                </div>

                <div className="p-6 overflow-y-auto bg-gray-50 flex-1">
                    {loading ? (
                        <div className="flex justify-center items-center h-32 text-gray-400">Loading historical records...</div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-dashed">No history found.</div>
                    ) : (
                        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                            {versions.map((v, index) => (
                                <div key={v._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 font-bold text-sm">
                                        V{v.version_number}
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-slate-800 flex items-center gap-1.5 text-sm">
                                                <User className="h-3 w-3" /> {v.updated_by?.fullName || 'Admin'}
                                            </span>
                                            {index === 0 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">CURRENT</span>}
                                        </div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                                            <Clock className="h-3 w-3" />
                                            {new Date(v.createdAt).toLocaleString()}
                                        </div>
                                        {v.file_path ? (
                                            <a href={v.file_path} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                                <ExternalLink className="mr-1 h-3 w-3" /> View Source File
                                            </a>
                                        ) : v.content ? (
                                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border truncate" dangerouslySetInnerHTML={{ __html: v.content.substring(0, 50) + '...' }} />
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">No content available</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border-t px-6 py-4 flex justify-end">
                    <Button onClick={onClose} variant="outline">Close Viewer</Button>
                </div>
            </div>
        </div>
    );
}
