'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X, Menu, BookOpen, Download, FileText, Printer, Bell
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface NoticeDoc {
    _id: string;
    title: string;
    content: string;           // main body text
    category: string;
    priority: string;
    file_type: string;
    attachmentUrl?: string;
    attachmentName?: string;
    attachment_content?: string; // rich-text / md inline content
    createdAt: string;
}

interface NoticeReaderProps {
    notice: NoticeDoc;
    onClose: () => void;
}

const priorityColor: Record<string, string> = {
    high: 'text-red-400 border-red-400/30 bg-red-400/10',
    normal: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    low: 'text-gray-400 border-gray-400/30 bg-gray-400/10',
};

export default function NoticeReader({ notice, onClose }: NoticeReaderProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [fontSize, setFontSize] = useState(17);
    const [fetchedContent, setFetchedContent] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const ft = notice.file_type?.toLowerCase();
    const isRichText = ft === 'rich-text' || ft === 'rich_text';
    const isPdf = ft === 'pdf' || notice.attachmentUrl?.toLowerCase().endsWith('.pdf');
    const isFile = ['pdf', 'docx', 'pptx', 'xlsx'].includes(ft);

    // The secondary (attachment) content for rich / md
    const baseContent = (notice.attachment_content || '').trim();
    const activeContent = (fetchedContent || baseContent).trim();

    const isMarkdown = useMemo(() => {
        const hasMDPattern = /^(#|---|\\*|-|\\d+\\.|\>|\\[.*\\]\\(.*\\))/.test(activeContent) ||
            activeContent.includes('**') || activeContent.includes('##') || activeContent.includes('###');
        return ft === 'md' || ft === 'markdown' ||
            notice.attachmentUrl?.toLowerCase().endsWith('.md') || hasMDPattern;
    }, [ft, notice.attachmentUrl, activeContent]);

    // Fetch MD from URL if we don't have inline content
    useEffect(() => {
        setFetchedContent(null);
        if (isMarkdown && !baseContent && notice.attachmentUrl && !loadingContent) {
            setLoadingContent(true);
            fetch(notice.attachmentUrl)
                .then(r => r.text())
                .then(t => setFetchedContent(t))
                .catch(err => console.error('Failed to fetch MD:', err))
                .finally(() => setLoadingContent(false));
        }
    }, [notice._id, isMarkdown, baseContent, notice.attachmentUrl]);

    // Table of contents from markdown headings
    const chapters = useMemo(() => {
        if (!activeContent || !isMarkdown) return [];
        return activeContent.split('\n')
            .reduce<{ id: string; title: string; level: number }[]>((acc, line, i) => {
                const m = line.match(/^(#{1,3})\s+(.+)$/);
                if (m) acc.push({ id: `heading-${acc.length}`, title: m[2].trim(), level: m[1].length });
                return acc;
            }, []);
    }, [activeContent, isMarkdown]);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSection(id);
    };

    const handlePrint = () => {
        const w = window.open('', '_blank', 'width=900,height=700');
        if (!w) return;
        const body = isMarkdown
            ? activeContent.split('\n').map(line => {
                if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
                if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
                if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
                if (!line.trim()) return '<br/>';
                return `<p>${line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>')}</p>`;
            }).join('\n')
            : isRichText ? activeContent : `<p>${notice.content}</p>`;

        w.document.write(`<!DOCTYPE html><html><head><title>${notice.title}</title>
        <style>body{font-family:Georgia,serif;font-size:11pt;line-height:1.7;color:#111;max-width:760px;margin:2cm auto;}
        h1,h2,h3{color:#0f172a;page-break-after:avoid;}h2{text-transform:uppercase;border-bottom:1px solid #ddd;padding-bottom:.3rem;}
        p{margin-bottom:1rem;}</style></head>
        <body><h1>${notice.title}</h1><p style="color:#666;font-size:9pt;text-transform:uppercase;letter-spacing:.1em;">
        ${notice.category} · ${notice.priority} priority · ${new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p><hr/>${body}</body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 400);
    };

    return (
        <motion.div
            id="notice-reader-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f172a] z-[200] flex flex-col overflow-hidden font-sans"
        >
            {/* Top Bar */}
            <header className="h-16 flex-shrink-0 bg-white/5 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition"
                    >
                        <X size={18} className="text-white/60" />
                    </button>
                    <div className="w-px h-6 bg-white/10 mx-1" />
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <Bell className="text-amber-400" size={18} />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm leading-tight uppercase tracking-wide">{notice.title}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-white/40 text-[10px] font-medium tracking-widest uppercase">{notice.category}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold uppercase tracking-widest ${priorityColor[notice.priority] || priorityColor.normal}`}>{notice.priority}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg border border-amber-500/30 transition group"
                    >
                        <Printer size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Print</span>
                    </button>

                    {/* Font size controls — only useful for text/MD */}
                    {(isMarkdown || isRichText || (!isFile && !isPdf)) && (
                        <div className="flex items-center bg-white/5 rounded-lg px-2 py-1 border border-white/5">
                            <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1.5 text-white/60 hover:text-white transition">
                                <span className="text-xs font-bold">A-</span>
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button onClick={() => setFontSize(Math.min(30, fontSize + 2))} className="p-1.5 text-white/60 hover:text-white transition">
                                <span className="text-lg font-bold leading-none">A+</span>
                            </button>
                        </div>
                    )}

                    {/* Download button for file attachments */}
                    {isFile && notice.attachmentUrl && (
                        <a
                            href={notice.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-lg border border-teal-500/30 transition"
                        >
                            <Download size={15} />
                            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Download</span>
                        </a>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* TOC Sidebar — only for Markdown */}
                {isMarkdown && chapters.length > 0 && (
                    <aside className={`bg-slate-50 border-r border-slate-200 transition-all duration-300 overflow-y-auto flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}`}>
                        <div className="p-6">
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Table of Contents</h3>
                            <nav className="space-y-1">
                                {chapters.map(ch => (
                                    <button
                                        key={ch.id}
                                        onClick={() => scrollTo(ch.id)}
                                        className={`w-full text-left py-1.5 px-3 rounded-lg transition-all text-xs font-medium border-l-2 ${activeSection === ch.id
                                            ? 'bg-amber-50 text-amber-700 border-amber-500'
                                            : 'text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900'
                                            } ${ch.level === 1 ? 'ml-0 font-bold' : ch.level === 2 ? 'ml-3' : 'ml-6 text-[11px] opacity-80'}`}
                                    >
                                        {ch.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>
                )}

                {/* Main Content */}
                <main className="flex-1 bg-white overflow-y-auto relative">
                    {isMarkdown && chapters.length > 0 && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="fixed left-4 bottom-8 z-30 w-12 h-12 rounded-2xl bg-[#0f172a] text-white shadow-2xl flex items-center justify-center hover:bg-amber-600 transition-all border border-white/10"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    <div className="max-w-4xl mx-auto px-8 py-12">
                        {/* Notice body (the main text always shown) */}
                        <div className="mb-8 p-6 bg-amber-50 border border-amber-100 rounded-2xl">
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-2">Notice Content</p>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap" style={{ fontSize: `${fontSize}px` }}>
                                {notice.content}
                            </p>
                        </div>

                        {/* Attachment section */}
                        {loadingContent ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-slate-400 animate-pulse text-sm">Loading attachment...</p>
                            </div>
                        ) : (isMarkdown && activeContent) ? (
                            <div className="prose prose-slate max-w-none" style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}>
                                <div className="font-serif text-[#334155]">
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => {
                                                const title = String(props.children);
                                                const idx = chapters.findIndex(c => c.title === title && c.level === 1);
                                                return <h1 id={`heading-${idx}`} {...props} />;
                                            },
                                            h2: ({ node, ...props }) => {
                                                const title = String(props.children);
                                                const idx = chapters.findIndex(c => c.title === title && c.level === 2);
                                                return <h2 id={`heading-${idx}`} {...props} />;
                                            },
                                            h3: ({ node, ...props }) => {
                                                const title = String(props.children);
                                                const idx = chapters.findIndex(c => c.title === title && c.level === 3);
                                                return <h3 id={`heading-${idx}`} {...props} />;
                                            },
                                        }}
                                    >
                                        {activeContent}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : isRichText && activeContent ? (
                            <div className="prose prose-slate max-w-none font-serif text-[#334155]" style={{ fontSize: `${fontSize}px` }}>
                                <div dangerouslySetInnerHTML={{ __html: activeContent }} />
                            </div>
                        ) : isPdf && notice.attachmentUrl ? (
                            <div className="w-full h-[75vh] bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                                <iframe
                                    src={`${notice.attachmentUrl}#toolbar=0`}
                                    className="w-full h-full border-none"
                                    title={notice.title}
                                />
                            </div>
                        ) : notice.attachmentUrl ? (
                            <div className="flex flex-col items-center justify-center py-16 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                <FileText size={64} className="text-slate-200 mb-5" />
                                <h2 className="text-xl font-bold text-slate-700 mb-2">{notice.attachmentName || 'Attached Document'}</h2>
                                <p className="text-slate-500 mb-6 text-sm">This {(notice.file_type || '').toUpperCase()} file can be downloaded for viewing.</p>
                                <a
                                    href={notice.attachmentUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="px-8 py-3 bg-amber-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-amber-600 transition shadow-lg flex items-center gap-2"
                                >
                                    <Download size={15} /> Download File
                                </a>
                            </div>
                        ) : null}
                    </div>

                    {/* Reading progress bar */}
                    <div className="fixed bottom-0 left-0 right-0 h-1 bg-white/10 z-20">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '30%' }}
                            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                        />
                    </div>
                </main>
            </div>

            <style>{`
                .prose h2 { font-weight: 800; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5rem; margin-top: 3rem; text-transform: uppercase; }
                .prose p { margin-bottom: 1.5rem; }
            `}</style>
        </motion.div>
    );
}
