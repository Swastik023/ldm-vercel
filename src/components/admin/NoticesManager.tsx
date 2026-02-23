'use client';

import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    Trash2, Calendar, Paperclip, Upload, FileText, X, Loader2,
    AlertTriangle, Bell, ChevronDown, Eye, Download, BookOpen,
    FileCode, FileSpreadsheet, Presentation
} from 'lucide-react';
import NoticeReader from '@/components/notices/NoticeReader';

interface Notice {
    _id: string;
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'normal' | 'high';
    file_type: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachment_content?: string;
    createdAt: string;
}

const CATEGORIES = ['general', 'academic', 'exam', 'event', 'urgent'];
const PRIORITIES = ['low', 'normal', 'high'];

const FILE_TYPES = [
    { value: 'none', label: 'Text Only', icon: FileText, desc: 'Plain notice, no attachment' },
    { value: 'rich-text', label: 'Rich Text', icon: BookOpen, desc: 'Write formatted HTML content' },
    { value: 'md', label: 'Markdown', icon: FileCode, desc: 'Write or upload a .md file' },
    { value: 'pdf', label: 'PDF', icon: FileText, desc: 'Upload a PDF document' },
    { value: 'docx', label: 'Word', icon: FileText, desc: 'Upload a .docx file' },
    { value: 'pptx', label: 'PowerPoint', icon: Presentation, desc: 'Upload a .pptx file' },
    { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet, desc: 'Upload a .xlsx file' },
];

const ACCEPT_MAP: Record<string, string> = {
    pdf: '.pdf',
    docx: '.doc,.docx',
    pptx: '.ppt,.pptx',
    xlsx: '.xls,.xlsx',
    md: '.md,.markdown',
};

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

function getFileIcon(ft: string) {
    switch (ft) {
        case 'rich-text': return <BookOpen className="w-4 h-4 text-blue-500" />;
        case 'md': return <FileCode className="w-4 h-4 text-teal-500" />;
        case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
        case 'xlsx': return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
        case 'pptx': return <Presentation className="w-4 h-4 text-orange-500" />;
        default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
}

function getFileBadge(ft: string) {
    const map: Record<string, { label: string; cls: string }> = {
        'rich-text': { label: 'Rich Text', cls: 'bg-blue-100 text-blue-700' },
        md: { label: 'Markdown', cls: 'bg-teal-100 text-teal-700' },
        pdf: { label: 'PDF', cls: 'bg-red-100 text-red-700' },
        docx: { label: 'Word', cls: 'bg-blue-100 text-blue-700' },
        pptx: { label: 'Slides', cls: 'bg-orange-100 text-orange-700' },
        xlsx: { label: 'Excel', cls: 'bg-green-100 text-green-700' },
        none: { label: '', cls: '' },
    };
    return map[ft] || map.none;
}

export default function NoticesManager({ initialNotices }: { initialNotices: Notice[] }) {
    const [notices, setNotices] = useState<Notice[]>(initialNotices);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('general');
    const [priority, setPriority] = useState('normal');
    const [fileType, setFileType] = useState('none');
    const [attachmentContent, setAttachmentContent] = useState(''); // rich-text / md
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [readerNotice, setReaderNotice] = useState<Notice | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const isInlineContent = fileType === 'rich-text' || fileType === 'md';
    const isFileUpload = ['pdf', 'docx', 'pptx', 'xlsx'].includes(fileType);
    const selectedTypeMeta = FILE_TYPES.find(t => t.value === fileType);

    const resetForm = () => {
        setTitle(''); setContent(''); setCategory('general'); setPriority('normal');
        setFileType('none'); setAttachmentContent(''); setFile(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) { toast.error('Title and content are required'); return; }
        setIsLoading(true);
        try {
            const fd = new FormData();
            fd.append('title', title.trim());
            fd.append('content', content.trim());
            fd.append('category', category);
            fd.append('priority', priority);
            fd.append('file_type', fileType);
            if (attachmentContent) fd.append('attachment_content', attachmentContent);
            if (file) fd.append('file', file);

            const res = await fetch('/api/admin/notices', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.success) {
                toast.success('Notice posted!');
                setNotices([data.notice, ...notices]);
                resetForm();
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
            if (data.success) { toast.success('Notice deleted'); setNotices(notices.filter(n => n._id !== id)); }
            else toast.error('Failed to delete');
        } catch { toast.error('Network error'); }
    };

    const canPreview = (n: Notice) =>
        n.file_type === 'rich-text' || n.file_type === 'md' ||
        n.file_type === 'pdf' || !!n.attachmentUrl || !!n.attachment_content;

    return (
        <>
            <div className="space-y-8 max-w-4xl">
                {/* ── Create Form ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Post a New Notice</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Add text, rich content, or attach PDF / Word / Slides / Excel files.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                                placeholder="e.g. Exam Schedule – March 2026"
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                        </div>

                        {/* Body Content */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notice Body <span className="text-red-500">*</span></label>
                            <textarea value={content} onChange={e => setContent(e.target.value)} required rows={3}
                                placeholder="Summary or main message of the notice..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-y" />
                        </div>

                        {/* Category + Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-400">
                                    {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select value={priority} onChange={e => setPriority(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm capitalize focus:outline-none focus:ring-2 focus:ring-amber-400">
                                    {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* ── Content / Attachment Type ── */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Attachment / Content Format</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {FILE_TYPES.map(({ value, label, icon: Icon, desc }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => { setFileType(value); setFile(null); setAttachmentContent(''); if (fileRef.current) fileRef.current.value = ''; }}
                                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs font-medium transition-all text-center ${fileType === value
                                            ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm'
                                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-amber-200 hover:bg-amber-50/30'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{label}</span>
                                    </button>
                                ))}
                            </div>
                            {selectedTypeMeta && (
                                <p className="text-xs text-gray-400 mt-1.5 ml-1">
                                    <span className="font-medium text-gray-500">{selectedTypeMeta.label}:</span> {selectedTypeMeta.desc}
                                </p>
                            )}
                        </div>

                        {/* Inline editors */}
                        {isInlineContent && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {fileType === 'rich-text' ? 'Rich Text / HTML Content' : 'Markdown Content'}
                                </label>
                                <textarea
                                    value={attachmentContent}
                                    onChange={e => setAttachmentContent(e.target.value)}
                                    rows={10}
                                    placeholder={fileType === 'rich-text'
                                        ? '<h2>Section Title</h2>\n<p>Formatted notice content...</p>'
                                        : '# Notice Title\n\n## Details\n\nWrite your notice in **Markdown** format...'}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                                />
                                <p className="text-xs text-gray-400 mt-1">This content will open in the immersive reader for viewers.</p>
                            </div>
                        )}

                        {/* File upload area */}
                        {isFileUpload && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload {selectedTypeMeta?.label} File</label>
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-colors"
                                >
                                    {file ? (
                                        <div className="flex items-center justify-center gap-3">
                                            {getFileIcon(fileType)}
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-800 truncate max-w-xs">{file.name}</p>
                                                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button type="button"
                                                onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                                className="ml-2 p-1 rounded-full hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="w-7 h-7 text-gray-300" />
                                            <p className="text-sm text-gray-500">Click to select a {selectedTypeMeta?.label} file</p>
                                            <p className="text-xs text-gray-400">Max 10MB</p>
                                        </div>
                                    )}
                                </div>
                                <input ref={fileRef} type="file" accept={ACCEPT_MAP[fileType] || '*'}
                                    onChange={e => {
                                        const f = e.target.files?.[0] || null;
                                        setFile(f);
                                        // Auto-read markdown files
                                        if (f && fileType === 'md') {
                                            const reader = new FileReader();
                                            reader.onload = ev => setAttachmentContent(ev.target?.result as string || '');
                                            reader.readAsText(f);
                                        }
                                    }}
                                    className="hidden" />
                            </div>
                        )}

                        {/* MD file upload alongside editor */}
                        {fileType === 'md' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Or Upload a .md File (auto-fills editor)</label>
                                <div onClick={() => fileRef.current?.click()}
                                    className="border-2 border-dashed border-teal-200 rounded-xl p-4 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors">
                                    {file ? (
                                        <div className="flex items-center justify-center gap-2 text-teal-700">
                                            <FileCode className="w-5 h-5" />
                                            <span className="text-sm font-medium">{file.name}</span>
                                            <button type="button" onClick={e => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                                                className="ml-1 text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-teal-600">Click to upload .md / .markdown file</p>
                                    )}
                                </div>
                                <input ref={fileRef} type="file" accept=".md,.markdown"
                                    onChange={e => {
                                        const f = e.target.files?.[0] || null;
                                        setFile(f);
                                        if (f) {
                                            const r = new FileReader();
                                            r.onload = ev => setAttachmentContent(ev.target?.result as string || '');
                                            r.readAsText(f);
                                        }
                                    }}
                                    className="hidden" />
                            </div>
                        )}

                        {/* Submit */}
                        <button type="submit" disabled={isLoading}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm">
                            {isLoading
                                ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting...</>
                                : <><Upload className="w-4 h-4" /> Post Notice</>}
                        </button>
                    </form>
                </div>

                {/* ── Notices List ── */}
                <div className="space-y-3">
                    <h3 className="text-base font-semibold text-gray-700 px-1">All Notices ({notices.length})</h3>
                    {notices.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                            <AlertTriangle className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-500 font-medium">No notices yet</p>
                            <p className="text-sm text-gray-400">Post your first notice using the form above.</p>
                        </div>
                    ) : (
                        notices.map(notice => {
                            const badge = getFileBadge(notice.file_type);
                            return (
                                <div key={notice._id}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            {/* Badges row */}
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                <h4 className="font-semibold text-gray-800 text-base">{notice.title}</h4>
                                                <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${categoryColor[notice.category] || 'bg-gray-100 text-gray-600'}`}>
                                                    {notice.category}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${priorityColor[notice.priority]}`}>
                                                    {notice.priority}
                                                </span>
                                                {badge.label && (
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${badge.cls}`}>
                                                        {getFileIcon(notice.file_type)} {badge.label}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-2">{notice.content}</p>
                                            <div className="flex flex-wrap items-center gap-4 mt-3">
                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                                {/* View button for rich/md/pdf */}
                                                {canPreview(notice) && (
                                                    <button
                                                        onClick={() => setReaderNotice(notice)}
                                                        className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        {notice.file_type === 'rich-text' || notice.file_type === 'md' ? 'Open Reader' : 'View Attachment'}
                                                    </button>
                                                )}
                                                {/* Download for office files */}
                                                {notice.attachmentUrl && ['docx', 'pptx', 'xlsx'].includes(notice.file_type) && (
                                                    <a href={notice.attachmentUrl} target="_blank" rel="noopener noreferrer" download
                                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors">
                                                        <Download className="w-3.5 h-3.5" />
                                                        {notice.attachmentName || 'Download'}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(notice._id)} title="Delete notice"
                                            className="flex-shrink-0 p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
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
}
