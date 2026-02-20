'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    X, Menu, ChevronLeft, ChevronRight, BookOpen,
    Download, Info, Lightbulb, Link2, Monitor,
    Maximize2, FileText, Layout, Printer
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PremiumBookReaderProps {
    doc: {
        _id: string;
        title: string;
        description?: string;
        content?: string;
        url?: string;
        file_type: string;
        category: string;
        program?: { code: string; name: string } | null;
    };
    onClose: () => void;
}

export default function PremiumBookReader({ doc, onClose }: PremiumBookReaderProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [fontSize, setFontSize] = useState(18);
    const [fetchedContent, setFetchedContent] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [activeSection, setActiveSection] = useState<string | null>(null);

    const isRichText = doc.file_type === 'rich-text' || doc.file_type === 'rich_text';

    // Use fetched content if available, otherwise fallback to doc.content
    const activeContent = (fetchedContent || doc.content || '').trim();

    // Robust Markdown detection: Check file_type OR if content starts with a Markdown header OR if URL ends in .md
    const isMarkdown = useMemo(() => {
        const t = doc.file_type?.toLowerCase();
        // Check for common Markdown patterns anywhere in the string
        const hasMDPattern = /^(#|---|\*|-|\d+\.|>|\[.*\]\(.*\))/.test(activeContent) ||
            activeContent.includes('**') ||
            activeContent.includes('##') ||
            activeContent.includes('###');

        return t === 'md' || t === 'markdown' ||
            doc.url?.toLowerCase().endsWith('.md') ||
            hasMDPattern;
    }, [doc.file_type, doc.url, activeContent]);

    const isPdf = doc.file_type === 'pdf' || doc.url?.toLowerCase().endsWith('.pdf');

    // Effect to fetch MD content if missing or when doc changes
    useEffect(() => {
        setFetchedContent(null);
        if (isMarkdown && !doc.content && doc.url && !loadingContent) {
            setLoadingContent(true);
            fetch(doc.url)
                .then(res => res.text())
                .then(text => setFetchedContent(text))
                .catch(err => console.error('Failed to fetch MD content:', err))
                .finally(() => setLoadingContent(false));
        }
    }, [doc._id, isMarkdown, doc.content, doc.url]);

    // Chapters/Headings logic for Notion-style TOC
    const chapters = useMemo(() => {
        if (!activeContent || !isMarkdown) return [];

        const lines = activeContent.split('\n');
        const extracted: any[] = [];

        lines.forEach((line, index) => {
            const match = line.match(/^(#{1,3})\s+(.+)$/);
            if (match) {
                const level = match[1].length;
                const title = match[2].trim();
                extracted.push({
                    id: `heading-${extracted.length}`,
                    title,
                    level,
                    index
                });
            }
        });

        return extracted;
    }, [activeContent, isMarkdown]);

    const handlePrint = () => {
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) return;

        const titleText = doc.title;
        const category = doc.program?.code ? `${doc.program.code} · ${doc.category}` : doc.category;

        // Build the rendered HTML content
        let bodyContent = '';
        if (isMarkdown || activeContent.includes('##')) {
            // Convert Markdown to plain HTML for print
            // Render basic markdown: headings + paragraphs (sufficient for print)
            const lines = activeContent.split('\n');
            const htmlLines = lines.map(line => {
                if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
                if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
                if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
                if (line.startsWith('**') && line.endsWith('**')) return `<strong>${line.slice(2, -2)}</strong>`;
                if (line.trim() === '') return '<br/>';
                // Handle bold inline
                const processed = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.+?)\*/g, '<em>$1</em>')
                    .replace(/`(.+?)`/g, '<code>$1</code>');
                return `<p>${processed}</p>`;
            });
            bodyContent = htmlLines.join('\n');
        } else {
            bodyContent = activeContent;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${titleText}</title>
                <style>
                    @page { margin: 2cm; }
                    body {
                        font-family: Georgia, 'Times New Roman', serif;
                        font-size: 11pt;
                        line-height: 1.7;
                        color: #111;
                        background: white;
                        margin: 0;
                        padding: 0;
                    }
                    .doc-header {
                        border-bottom: 2px solid #0f172a;
                        padding-bottom: 1rem;
                        margin-bottom: 2rem;
                    }
                    .doc-header h1 {
                        font-size: 1.8rem;
                        font-weight: 900;
                        margin: 0 0 0.3rem 0;
                        color: #0f172a;
                        text-transform: uppercase;
                        letter-spacing: -0.02em;
                    }
                    .doc-header .meta {
                        font-size: 9pt;
                        font-family: Arial, sans-serif;
                        color: #666;
                        letter-spacing: 0.1em;
                        text-transform: uppercase;
                    }
                    h1 { font-size: 1.6rem; margin-top: 2rem; page-break-after: avoid; color: #0f172a; }
                    h2 { font-size: 1.3rem; margin-top: 2rem; page-break-after: avoid; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem; text-transform: uppercase; color: #0f172a; }
                    h3 { font-size: 1.1rem; margin-top: 1.5rem; page-break-after: avoid; color: #334155; }
                    p { margin-bottom: 1rem; }
                    strong { font-weight: bold; }
                    em { font-style: italic; }
                    code { font-family: monospace; background: #f5f5f5; padding: 0px 4px; border-radius: 3px; font-size: 10pt; }
                    li { margin-bottom: 0.5rem; }
                    ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; }
                </style>
            </head>
            <body>
                <div class="doc-header">
                    <h1>${titleText}</h1>
                    <div class="meta">${category}</div>
                </div>
                ${bodyContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    };

    const scrollToHeading = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSection(id);
        }
    };

    return (
        <motion.div
            id="premium-reader-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f172a] z-[200] flex flex-col overflow-hidden font-sans print-root"
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
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
                        <BookOpen className="text-teal-400" size={20} />
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-sm leading-tight uppercase tracking-wide">
                            {doc.title}
                        </h1>
                        <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase">
                            {doc.program?.code || 'INSTITUTIONAL'} • {doc.category}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 rounded-lg border border-teal-500/30 transition shadow-sm group"
                    >
                        <Printer size={16} className="group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">Save as PDF</span>
                    </button>

                    <div className="flex items-center bg-white/5 rounded-lg px-2 py-1 border border-white/5">
                        <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="p-1.5 text-white/60 hover:text-white transition group">
                            <span className="text-xs font-bold group-hover:scale-110 block">A-</span>
                        </button>
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="p-1.5 text-white/60 hover:text-white transition group">
                            <span className="text-lg font-bold group-hover:scale-110 block leading-none">A+</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Minimalist Notion-style TOC Sidebar */}
                {isMarkdown && chapters.length > 0 && (
                    <aside
                        className={`bg-slate-50 border-r border-slate-200 transition-all duration-300 overflow-y-auto custom-scrollbar flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}`}
                    >
                        <div className="p-6">
                            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Table of Contents</h3>
                            <nav className="space-y-1">
                                {chapters.map((ch) => (
                                    <button
                                        key={ch.id}
                                        onClick={() => scrollToHeading(ch.id)}
                                        className={`w-full text-left py-1.5 px-3 rounded-lg transition-all text-xs font-medium border-l-2 ${activeSection === ch.id
                                            ? 'bg-teal-50 text-teal-700 border-teal-500'
                                            : 'text-slate-500 border-transparent hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100'
                                            } ${ch.level === 1 ? 'ml-0 font-bold' :
                                                ch.level === 2 ? 'ml-3' : 'ml-6 text-[11px] opacity-80'
                                            }`}
                                    >
                                        {ch.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </aside>
                )}

                {/* Main Content Area - Full Width Focused */}
                <main className="flex-1 bg-white overflow-y-auto custom-scrollbar relative">
                    {/* Floating Sidebar Toggle Container Overlay */}
                    {isMarkdown && chapters.length > 0 && (
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="fixed left-4 bottom-8 z-30 w-12 h-12 rounded-2xl bg-[#0f172a] text-white shadow-2xl flex items-center justify-center hover:bg-teal-600 transition-all border border-white/10"
                        >
                            <Menu size={20} />
                        </button>
                    )}

                    <div className="max-w-4xl mx-auto px-8 py-16">
                        {loadingContent ? (
                            <div className="flex flex-col items-center justify-center py-24 gap-4">
                                <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                                <p className="text-slate-400 font-medium animate-pulse">Fetching documentation content...</p>
                            </div>
                        ) : (isMarkdown || activeContent.includes('##')) ? (
                            <div
                                className="prose prose-slate max-w-none markdown-reader"
                                style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
                            >
                                <div className="font-serif text-[#334155]">
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => {
                                                const title = String(props.children);
                                                const hIndex = chapters.findIndex(c => c.title === title && c.level === 1);
                                                return <h1 id={`heading-${hIndex}`} {...props} />;
                                            },
                                            h2: ({ node, ...props }) => {
                                                const title = String(props.children);
                                                const hIndex = chapters.findIndex(c => c.title === title && c.level === 2);
                                                return <h2 id={`heading-${hIndex}`} {...props} />;
                                            },
                                            h3: ({ node, ...props }) => {
                                                const title = String(props.children);
                                                const hIndex = chapters.findIndex(c => c.title === title && c.level === 3);
                                                return <h3 id={`heading-${hIndex}`} {...props} />;
                                            }
                                        }}
                                    >
                                        {activeContent}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : isRichText ? (
                            <div className="reader-content font-serif text-[#334155]">
                                <div dangerouslySetInnerHTML={{ __html: activeContent }} />
                            </div>
                        ) : isPdf ? (
                            <div className="w-full h-[80vh] bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                                <iframe
                                    src={`${doc.url}#toolbar=0`}
                                    className="w-full h-full border-none"
                                    title={doc.title}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                <FileText size={80} className="text-slate-200 mb-6" />
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Office Document View</h2>
                                <p className="text-slate-500 mb-8 text-center max-w-sm">
                                    This {doc.file_type.toUpperCase()} file needs to be downloaded or opened in a specialized viewer.
                                </p>
                                <div className="flex gap-4">
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-teal-700 transition shadow-lg flex items-center gap-2"
                                    >
                                        <Download size={16} /> Download File
                                    </a>
                                    <button className="px-8 py-3 border border-slate-300 text-slate-600 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-50 transition">
                                        External Preview
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Progress Bar */}
                    <div className="fixed bottom-0 left-0 right-0 h-1 bg-white/10 z-20 backdrop-blur-sm">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '45%' }} // Mock progress for now
                            className="h-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                        />
                    </div>
                </main>
            </div>

            <style>{`
                @media print {
                    /* Reset everything for a standard document flow */
                    @page {
                        margin: 2cm !important;
                    }

                    html, body {
                        background: white !important;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        overflow: visible !important;
                        display: block !important;
                    }

                    /* Hide everything except the reader content */
                    body > *:not(.print-root),
                    #premium-reader-root > header,
                    #premium-reader-root > div > aside,
                    #premium-reader-root button,
                    #premium-reader-root .fixed:not(#premium-reader-root),
                    .floating-sidebar-toggle {
                        display: none !important;
                        height: 0 !important;
                        overflow: hidden !important;
                    }

                    #premium-reader-root {
                        position: static !important;
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                    }

                    /* Important: Reset the flex container that holds the main content */
                    #premium-reader-root > div {
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        position: static !important;
                    }

                    main {
                        display: block !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: visible !important;
                        position: static !important;
                    }

                    /* Content containers - force full width for professional look */
                    .max-w-4xl {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                        position: static !important;
                    }

                    .markdown-reader, .reader-content, .prose {
                        max-width: 100% !important;
                        width: 100% !important;
                        font-size: 11pt !important;
                        color: black !important;
                        line-height: 1.6 !important;
                        display: block !important;
                    }

                    /* Typography fixes for print */
                    h1, h2, h3 {
                        color: #000 !important;
                        page-break-after: avoid !important;
                        margin-top: 1.5rem !important;
                        margin-bottom: 1rem !important;
                    }

                    h2 {
                        border-bottom: 1px solid #ddd !important;
                        padding-bottom: 0.3rem !important;
                        text-transform: uppercase !important;
                        font-size: 1.4rem !important;
                    }

                    p, li {
                        orphans: 3;
                        widows: 3;
                        margin-bottom: 1rem !important;
                        font-size: 11pt !important;
                    }

                    a {
                        text-decoration: underline !important;
                        color: black !important;
                    }
                }

                /* UI Custom Scrollbar and Styles */
                .prose h2 {
                    font-family: 'Lora', serif;
                    font-weight: 800;
                    color: #0f172a;
                    border-bottom: 2px solid #f1f5f9;
                    padding-bottom: 0.5rem;
                    margin-top: 3rem;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                }
                .prose p {
                    margin-bottom: 1.5rem;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0,0,0,0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0,0,0,0.2);
                }
            `}</style>
        </motion.div >
    );
}
