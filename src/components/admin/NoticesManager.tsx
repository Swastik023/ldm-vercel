'use client';

import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2, Calendar, Paperclip, Upload, FileText, X, Loader2, AlertTriangle, Download } from 'lucide-react';

interface Notice {
    _id: string;
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'normal' | 'high';
    attachmentUrl?: string;
    attachmentName?: string;
    createdAt: string;
}

const CATEGORIES = ['general', 'academic', 'exam', 'event', 'urgent'];
const PRIORITIES = ['low', 'normal', 'high'];

const priorityColor: Record<string, string> = {
    high: 'text-red-600 bg-red-50 border-red-200',
    normal: 'text-blue-600 bg-blue-50 border-blue-200',
    low: 'text-gray-500 bg-gray-50 border-gray-200',
};

const categoryColor: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    academic: 'bg-blue-100 text-blue-700',
    exam: 'bg-purple-100 text-purple-700',
    event: 'bg-green-100 text-green-700',
    general: 'bg-gray-100 text-gray-600',
};

export default function NoticesManager({ initialNotices }: { initialNotices: Notice[] }) {
    const [notices, setNotices] = useState<Notice[]>(initialNotices);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('general');
    const [priority, setPriority] = useState('normal');
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            toast.error('Title and content are required');
            return;
        }
        setIsLoading(true);

        try {
            const fd = new FormData();
            fd.append('title', title.trim());
            fd.append('content', content.trim());
            fd.append('category', category);
            fd.append('priority', priority);
            if (file) fd.append('file', file);

            const res = await fetch('/api/admin/notices', { method: 'POST', body: fd });
            const data = await res.json();

            if (data.success) {
                toast.success('Notice posted successfully!');
                setNotices([data.notice, ...notices]);
                setTitle('');
                setContent('');
                setCategory('general');
                setPriority('normal');
                setFile(null);
                if (fileRef.current) fileRef.current.value = '';
            } else {
                toast.error(data.message || 'Failed to create notice');
            }
        } catch {
            toast.error('Network error — please try again');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this notice?')) return;
        try {
            const res = await fetch(`/api/admin/notices?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                toast.success('Notice deleted');
                setNotices(notices.filter(n => n._id !== id));
            } else {
                toast.error('Failed to delete notice');
            }
        } catch {
            toast.error('Network error');
        }
    };

    return (
        <div className="space-y-8 max-w-4xl">
            {/* Create Notice Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
                    <h2 className="text-lg font-semibold text-gray-800">Post a New Notice</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Attach PDFs, Word files, or images as supporting documents.</p>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Exam Schedule - March 2026"
                            required
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            placeholder="Write notice content here..."
                            required
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
                        />
                    </div>

                    {/* Category + Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {CATEGORIES.map(c => (
                                    <option key={c} value={c} className="capitalize">{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {PRIORITIES.map(p => (
                                    <option key={p} value={p} className="capitalize">{p}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* File Attachment */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                        >
                            {file ? (
                                <div className="flex items-center justify-center gap-3">
                                    <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                        className="ml-2 p-1 rounded-full hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Paperclip className="w-7 h-7 text-gray-300" />
                                    <p className="text-sm text-gray-500">Click to attach a document</p>
                                    <p className="text-xs text-gray-400">PDF, Word, Excel, PPT, Images — max 10MB</p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                            onChange={e => setFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Posting{file ? ' & Uploading...' : '...'}</>
                        ) : (
                            <><Upload className="w-4 h-4" /> Post Notice</>
                        )}
                    </button>
                </form>
            </div>

            {/* Notices List */}
            <div className="space-y-3">
                <h3 className="text-base font-semibold text-gray-700 px-1">All Notices ({notices.length})</h3>

                {notices.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <AlertTriangle className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                        <p className="text-gray-500 font-medium">No notices yet</p>
                        <p className="text-sm text-gray-400">Post your first notice using the form above.</p>
                    </div>
                ) : (
                    notices.map(notice => (
                        <div
                            key={notice._id}
                            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <h4 className="font-semibold text-gray-800 text-base">{notice.title}</h4>
                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${categoryColor[notice.category] || 'bg-gray-100 text-gray-600'}`}>
                                            {notice.category}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${priorityColor[notice.priority]}`}>
                                            {notice.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">{notice.content}</p>
                                    <div className="flex flex-wrap items-center gap-4 mt-3">
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        {notice.attachmentUrl && (
                                            <a
                                                href={notice.attachmentUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                            >
                                                <Paperclip className="w-3.5 h-3.5" />
                                                {notice.attachmentName || 'View Attachment'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(notice._id)}
                                    title="Delete notice"
                                    className="flex-shrink-0 p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
