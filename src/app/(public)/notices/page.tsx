'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell, Calendar, AlertTriangle, Info, BookOpen, Paperclip,
    Download, Eye, FileText, FileCode, FileSpreadsheet
} from 'lucide-react';
import NoticeReader from '@/components/notices/NoticeReader';

interface Notice {
    _id: string;
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'normal' | 'high';
    file_type: string;       // '' or undefined treated as 'none'
    attachmentUrl?: string;
    attachmentName?: string;
    attachment_content?: string;
    createdAt: string;
}

const categoryIcon = (cat: string) => {
    switch (cat) {
        case 'exam': return <BookOpen className="w-4 h-4" />;
        case 'urgent': return <AlertTriangle className="w-4 h-4" />;
        case 'academic': return <Bell className="w-4 h-4" />;
        default: return <Info className="w-4 h-4" />;
    }
};

const priorityStyle = (p: string) => {
    if (p === 'high') return 'border-red-500 bg-red-50';
    if (p === 'normal') return 'border-blue-500 bg-blue-50/30';
    return 'border-gray-300 bg-white';
};

const categoryBadge: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    academic: 'bg-blue-100 text-blue-700',
    exam: 'bg-purple-100 text-purple-700',
    event: 'bg-green-100 text-green-700',
    general: 'bg-gray-100 text-gray-600',
};

function getFileInfo(ft?: string) {
    switch (ft) {
        case 'rich-text': return { label: 'Rich Text', icon: <BookOpen className="w-3.5 h-3.5" />, cls: 'bg-blue-100 text-blue-700', action: 'Read' };
        case 'md': return { label: 'Markdown', icon: <FileCode className="w-3.5 h-3.5" />, cls: 'bg-teal-100 text-teal-700', action: 'Read' };
        case 'pdf': return { label: 'PDF', icon: <FileText className="w-3.5 h-3.5" />, cls: 'bg-red-100 text-red-700', action: 'View PDF' };
        case 'docx': return { label: 'Word', icon: <FileText className="w-3.5 h-3.5" />, cls: 'bg-blue-100 text-blue-700', action: 'Download' };
        case 'pptx': return { label: 'Slides', icon: <FileText className="w-3.5 h-3.5" />, cls: 'bg-orange-100 text-orange-700', action: 'Download' };
        case 'xlsx': return { label: 'Excel', icon: <FileSpreadsheet className="w-3.5 h-3.5" />, cls: 'bg-green-100 text-green-700', action: 'Download' };
        default: return null;
    }
}

const Notices: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');
    const [readerNotice, setReaderNotice] = useState<Notice | null>(null);

    useEffect(() => {
        fetch('/api/public/notices')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Normalise: ensure file_type is always a string
                    const raw = (data.notices || []) as Notice[];
                    setNotices(raw.map(n => ({ ...n, file_type: n.file_type ?? 'none' })));
                } else {
                    setNotices([]);
                }
            })
            .catch(err => { console.error(err); setError('Error connecting to server. Please try again later.'); setNotices([]); })
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? notices : notices.filter(n => n.category === filter);
    const categories = ['all', ...Array.from(new Set(notices.map(n => n.category)))];

    const openReader = (n: Notice) => setReaderNotice(n);

    const canRead = (n: Notice) =>
        n.file_type === 'rich-text' || n.file_type === 'md' ||
        n.file_type === 'pdf' || !!n.attachment_content || !!n.attachmentUrl;

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 mb-3">Latest Notices</h1>
                        <p className="text-lg text-gray-600">Updates and announcements from LDM College</p>
                    </div>

                    {/* Category filter */}
                    {!loading && notices.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center mb-8">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setFilter(cat)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition border ${filter === cat
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'}`}>
                                    {cat === 'all' ? 'All Notices' : cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center p-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
                        </div>
                    ) : error ? (
                        <div className="text-center text-red-600 p-8 bg-white rounded-lg shadow border border-red-100">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                            {error}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center text-gray-500 p-12 bg-white rounded-lg shadow">
                            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-xl font-semibold mb-1">No notices found</p>
                            <p className="text-sm">{filter !== 'all' ? 'Try selecting a different category.' : 'Please check back later for updates.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {filtered.map((notice, index) => {
                                const fileInfo = getFileInfo(notice.file_type);
                                const isDownload = ['docx', 'pptx', 'xlsx'].includes(notice.file_type || '');
                                return (
                                    <motion.div
                                        key={notice._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.07 }}
                                        className={`rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border-l-4 ${priorityStyle(notice.priority)}`}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h2 className="text-xl font-bold text-gray-800">{notice.title}</h2>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {fileInfo && (
                                                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${fileInfo.cls}`}>
                                                            {fileInfo.icon} {fileInfo.label}
                                                        </span>
                                                    )}
                                                    <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${categoryBadge[notice.category] || 'bg-gray-100 text-gray-600'}`}>
                                                        {categoryIcon(notice.category)}
                                                        {notice.category}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                            <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{notice.content}</div>

                                            {/* Action buttons for attachments */}
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                {canRead(notice) && !isDownload && (
                                                    <button
                                                        onClick={() => openReader({ ...notice, file_type: notice.file_type ?? 'none' })}
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        {fileInfo?.action || 'View Attachment'}
                                                    </button>
                                                )}
                                                {isDownload && notice.attachmentUrl && (
                                                    <a
                                                        href={notice.attachmentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        download
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        {notice.attachmentName || `Download ${fileInfo?.label}`}
                                                    </a>
                                                )}
                                                {/* Legacy single attachment fallback */}
                                                {notice.attachmentUrl && !notice.file_type && (
                                                    <a
                                                        href={notice.attachmentUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Paperclip className="w-4 h-4" />
                                                        {notice.attachmentName || 'Download Attachment'}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Immersive Reader Overlay ── */}
            <AnimatePresence>
                {readerNotice && (
                    <NoticeReader
                        key={readerNotice._id}
                        notice={readerNotice}
                        onClose={() => setReaderNotice(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Notices;
