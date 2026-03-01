'use client';

import { useEffect, useState } from 'react';
import { Bell, ChevronDown, ChevronUp, ExternalLink, AlertCircle } from 'lucide-react';

interface Notice {
    _id: string;
    title: string;
    content?: string;
    category?: string;
    priority?: number;
    startDate?: string;
    endDate?: string;
    attachmentUrl?: string;
    attachmentName?: string;
    file_type?: string;
    createdAt: string;
}

const PRIORITY_LABEL: Record<number, { label: string; cls: string }> = {
    1: { label: 'Low', cls: 'bg-gray-100 text-gray-500' },
    2: { label: 'Normal', cls: 'bg-blue-50 text-blue-600' },
    3: { label: 'High', cls: 'bg-amber-50 text-amber-700' },
    4: { label: 'Urgent', cls: 'bg-red-50 text-red-600' },
};

export default function TeacherNoticesPage() {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        // Teachers can read the same notices API (role check is inside)
        fetch('/api/student/notices')
            .then(r => r.json())
            .then(d => {
                if (d.success) setNotices(d.notices);
                else setError(d.message || 'Failed to load notices');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" />
        </div>
    );

    if (error) return (
        <div className="flex items-center gap-3 p-5 bg-red-50 rounded-xl text-red-600 border border-red-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="w-6 h-6 text-amber-600" /> Notices
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">{notices.length} active notice{notices.length !== 1 ? 's' : ''}</p>
            </div>

            {notices.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Bell className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 font-medium">No notices at this time</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notices.map(notice => {
                        const p = PRIORITY_LABEL[notice.priority ?? 2] ?? PRIORITY_LABEL[2];
                        const isOpen = expanded === notice._id;
                        return (
                            <div key={notice._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setExpanded(isOpen ? null : notice._id)}
                                    className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className="font-semibold text-gray-900 text-sm">{notice.title}</h3>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.cls}`}>{p.label}</span>
                                            {notice.category && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{notice.category}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            {notice.endDate && ` · Expires ${new Date(notice.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                                        </p>
                                    </div>
                                    {isOpen ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
                                </button>

                                {isOpen && (
                                    <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-3">
                                        {notice.content && (
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                                        )}
                                        {notice.attachmentUrl && (
                                            <a
                                                href={notice.attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                                {notice.attachmentName || 'View Attachment'}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
