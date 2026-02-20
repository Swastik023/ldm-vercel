'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    Search, Download, X, BookOpen, FileText, BookMarked,
    FlaskConical, ScrollText, FolderOpen, HelpCircle,
    ArrowRight, SortAsc, LayoutList, ChevronRight, Clock,
    Database, AlertCircle
} from 'lucide-react';
import PremiumBookReader from '@/components/library/PremiumBookReader';
import ReactMarkdown from 'react-markdown';

interface LibraryDoc {
    _id: string;
    title: string;
    description?: string;
    url: string;
    file_size?: number;
    file_type: string;
    content: string;
    category: string;
    program?: { code: string; name: string } | null;
    is_common?: boolean;
    current_version?: number;
    createdAt: string;
}

interface ProgramInfo {
    id: string;
    name: string;
    code: string;
}

const CATEGORY_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
    'Master Curriculum & Syllabus': { icon: BookMarked, color: 'text-violet-600', bg: 'bg-violet-100' },
    'Notes': { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
    'Question Papers': { icon: HelpCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
    'Lab Manuals': { icon: FlaskConical, color: 'text-green-600', bg: 'bg-green-100' },
    'Common Resources': { icon: FolderOpen, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    'Foundation Modules': { icon: Database, color: 'text-teal-600', bg: 'bg-teal-100' },
    'Module Notes': { icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100' },
};

function getFileMeta(type: string): { label: string; color: string; bg: string } {
    const t = type?.toLowerCase();
    if (t === 'rich-text' || t === 'rich_text') return { label: 'Academic Book', color: 'text-blue-700', bg: 'bg-blue-50' };
    if (t === 'md' || t === 'markdown') return { label: 'Markdown', color: 'text-teal-700', bg: 'bg-teal-50' };
    if (t?.includes('pdf')) return { label: 'PDF', color: 'text-red-700', bg: 'bg-red-50' };
    if (t?.includes('word') || t?.includes('doc') || t === 'docx') return { label: 'Word', color: 'text-blue-700', bg: 'bg-blue-50' };
    if (t === 'pptx' || t?.includes('powerpoint')) return { label: 'Slides', color: 'text-orange-700', bg: 'bg-orange-50' };
    if (t === 'xlsx' || t?.includes('excel')) return { label: 'Spreadsheet', color: 'text-green-700', bg: 'bg-green-50' };
    return { label: type?.toUpperCase() || 'FILE', color: 'text-gray-600', bg: 'bg-gray-100' };
}

function formatSize(bytes?: number) {
    if (!bytes) return null;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(d: string) {
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return 'N/A'; }
}

function getCategoryMeta(cat: string) {
    return CATEGORY_META[cat] || { icon: FolderOpen, color: 'text-gray-500', bg: 'bg-gray-100' };
}

export default function StudentLibrary() {
    const { status } = useSession();
    const router = useRouter();
    const [documents, setDocuments] = useState<LibraryDoc[]>([]);
    const [programs, setPrograms] = useState<ProgramInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeProgram, setActiveProgram] = useState<string | null>(null);
    const [studentProgCode, setStudentProgCode] = useState<string | null>(null);
    const [selected, setSelected] = useState<LibraryDoc | null>(null);
    const [showContent, setShowContent] = useState(false);
    const [sort, setSort] = useState<'newest' | 'az'>('newest');
    const [recentlyViewed, setRecentlyViewed] = useState<LibraryDoc[]>([]);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;

        Promise.all([
            fetch('/api/student/library').then(r => r.json()),
            fetch('/api/public/programs').then(r => r.json())
        ]).then(([libData, progData]) => {
            if (libData.success) {
                setDocuments(libData.documents || []);
                if (libData.student_program?.code) {
                    setStudentProgCode(libData.student_program.code);
                    setActiveProgram(libData.student_program.code);
                }
            } else {
                setError('Failed to load library resources.');
            }
            if (progData.success) setPrograms(progData.programs || []);
        }).catch(() => setError('Network error. Please try again.'))
            .finally(() => setLoading(false));
    }, [status]);

    const allCategories = useMemo(() => Array.from(new Set(documents.map(d => d.category))).filter(Boolean), [documents]);

    const filtered = useMemo(() => {
        let list = [...documents];

        // Filter by Program (includes common resources too)
        if (activeProgram) {
            list = list.filter(d => d.program?.code === activeProgram || d.is_common);
        }

        // Filter by Category
        if (activeCategory !== 'all') {
            list = list.filter(d => d.category === activeCategory);
        }

        // Search
        if (search) {
            list = list.filter(d =>
                d.title.toLowerCase().includes(search.toLowerCase()) ||
                d.description?.toLowerCase().includes(search.toLowerCase()) ||
                d.program?.code?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Sort
        if (sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
        else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return list;
    }, [documents, activeCategory, activeProgram, search, sort]);

    const groupedDocs = useMemo(() => {
        if (search) return null;
        const groups: Record<string, LibraryDoc[]> = {};
        filtered.forEach(d => {
            if (!groups[d.category]) groups[d.category] = [];
            groups[d.category].push(d);
        });
        return groups;
    }, [filtered, search]);

    const openDoc = (doc: LibraryDoc) => {
        setSelected(doc);
        // Automatically open reader for rich-text/markdown, show modal for others
        const t = doc.file_type?.toLowerCase();
        const contentStr = (doc.content || '').trim();
        const isMD = t === 'md' || t === 'markdown' ||
            doc.url?.toLowerCase().endsWith('.md') ||
            /^(#|---|\*|-|\d+\.|>|\[.*\]\(.*\))/.test(contentStr) ||
            contentStr.includes('**') ||
            contentStr.includes('##') ||
            contentStr.includes('###');

        const isPremiumDoc = t === 'rich-text' || t === 'rich_text' || isMD;

        if (isPremiumDoc) {
            setShowContent(true);
        } else {
            setShowContent(false);
        }

        setRecentlyViewed(prev => {
            const without = prev.filter(d => d._id !== doc._id);
            return [doc, ...without].slice(0, 3);
        });
    };

    if (status === 'loading' || loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="w-10 h-10 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading your library...</p>
            </div>
        );
    }

    const currentProgramName = programs.find(p => p.code === activeProgram)?.name || 'All Programs';

    return (
        <div className="flex min-h-full -m-6 bg-[#f0f2f5]">
            {/* Sidebar */}
            <aside className="w-60 bg-[#1a2332] text-white flex flex-col flex-shrink-0 sticky top-0 self-start h-[calc(100vh-64px)]">
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center shadow">
                            <BookOpen size={15} className="text-white" />
                        </div>
                        <div>
                            <div className="font-bold text-sm leading-tight">E-Library</div>
                            <div className="text-[10px] text-white/40">Resource Portal</div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
                    {/* Course Selector */}
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-2 flex items-center justify-between">
                            Courses
                            {activeProgram && (
                                <button onClick={() => setActiveProgram(null)} className="text-teal-400 hover:text-teal-300 normal-case tracking-normal">Clear</button>
                            )}
                        </p>
                        <div className="space-y-0.5">
                            <button
                                onClick={() => setActiveProgram(null)}
                                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-all ${!activeProgram ? 'bg-teal-500/20 text-teal-300' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                                <Database size={12} />
                                <span className="flex-1 text-left">Common Resources</span>
                            </button>
                            <div className="max-h-60 overflow-y-auto pr-1 mt-1 custom-scrollbar">
                                {programs.map(prog => (
                                    <button
                                        key={prog.code}
                                        onClick={() => setActiveProgram(prog.code)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-all ${activeProgram === prog.code ? 'bg-teal-500/20 text-teal-300 font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full ${activeProgram === prog.code ? 'bg-teal-400 animate-pulse' : 'bg-white/20'}`} />
                                        <span className="flex-1 text-left truncate">{prog.code}</span>
                                        {studentProgCode === prog.code && <span className="text-[8px] bg-teal-500/30 text-teal-300 px-1 rounded uppercase">Mine</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Collections */}
                    <div>
                        <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-2">Collections</p>
                        <div className="space-y-0.5">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-all ${activeCategory === 'all' ? 'bg-teal-500/10 text-teal-300' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                                <FolderOpen size={12} />
                                <span className="flex-1 text-left">All Categories</span>
                            </button>
                            {allCategories.map(cat => {
                                const meta = getCategoryMeta(cat);
                                const Icon = meta.icon;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] transition-all ${activeCategory === cat ? 'bg-teal-500/10 text-teal-300' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <Icon size={12} />
                                        <span className="flex-1 text-left truncate">{cat}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {recentlyViewed.length > 0 && (
                        <div>
                            <p className="text-[9px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-1.5 flex items-center gap-1">
                                <Clock size={9} /> Recently Viewed
                            </p>
                            {recentlyViewed.map(doc => (
                                <button key={doc._id} onClick={() => openDoc(doc)}
                                    className="w-full text-left px-3 py-1.5 rounded-lg text-[11px] text-white/50 hover:bg-white/5 hover:text-white/90 transition-all flex items-start gap-2 mb-0.5">
                                    <FileText size={11} className="mt-0.5 flex-shrink-0 text-teal-400/50" />
                                    <span className="truncate leading-tight uppercase tracking-tighter">{doc.title}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </nav>

                <div className="p-4 border-t border-white/5 text-[9px] text-white/20 text-center italic">
                    {documents.length} library items
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-y-auto">
                {/* Top bar */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 sticky top-0 z-10">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={`Search in ${activeProgram || 'all courses'}...`}
                            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                <X size={13} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <SortAsc size={14} className="text-gray-400" />
                        <select value={sort} onChange={e => setSort(e.target.value as 'newest' | 'az')}
                            className="text-xs border border-gray-200 rounded-lg py-2 px-2.5 bg-white outline-none focus:ring-2 focus:ring-teal-400">
                            <option value="newest">Newest First</option>
                            <option value="az">A → Z</option>
                        </select>
                    </div>
                </div>

                {/* Filter info bar */}
                <div className="bg-white border-b border-gray-100 px-6 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500">
                        <BookOpen size={11} className="text-teal-600" />
                        <span>Library</span>
                        <ChevronRight size={10} />
                        <span className="font-bold text-gray-900">{currentProgramName}</span>
                        {activeCategory !== 'all' && (
                            <>
                                <ChevronRight size={10} />
                                <span className="font-bold text-teal-600 uppercase tracking-tighter">{activeCategory}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Stats bar */}
                <div className="bg-gradient-to-r from-[#1a2332] via-[#0f766e] to-[#1a2332] px-6 py-3 flex items-center gap-6 text-xs text-white/90 shadow-inner">
                    <span><span className="font-bold text-teal-300">{filtered.length}</span> Results Found</span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span><span className="font-bold text-teal-300">{activeProgram ? 1 : programs.length}</span> Course Scopes</span>
                    <span className="w-1 h-1 rounded-full bg-white/30" />
                    <span className="text-white/40 italic">Academic library resources for curriculum enrichment</span>
                </div>

                {/* Content */}
                <div className="flex-1 px-6 py-5">
                    {error && (
                        <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <BookOpen size={40} className="mx-auto text-gray-100 mb-3" />
                            <p className="font-bold text-gray-400 text-sm">No documents matched your filter</p>
                            <p className="text-xs text-gray-400 mt-1">Try adjusting your course or collection filter.</p>
                            {(activeProgram || activeCategory !== 'all') && (
                                <button
                                    onClick={() => { setActiveProgram(studentProgCode); setActiveCategory('all'); }}
                                    className="mt-4 text-[11px] font-bold text-teal-600 uppercase tracking-widest hover:underline"
                                >
                                    Return to my program
                                </button>
                            )}
                        </div>
                    ) : groupedDocs ? (
                        Object.entries(groupedDocs).map(([cat, docs]) => (
                            <CategorySection key={cat} category={cat} docs={docs} onOpen={openDoc} />
                        ))
                    ) : (
                        <div className="space-y-2">
                            {filtered.map(doc => <DocRow key={doc._id} doc={doc} onOpen={openDoc} />)}
                        </div>
                    )}
                </div>
            </div>

            {/* Document Details & Reader Overlay */}
            <AnimatePresence mode="wait">
                {selected && (
                    showContent ? (
                        <PremiumBookReader
                            key="reader"
                            doc={selected as any}
                            onClose={() => {
                                setSelected(null);
                                setShowContent(false);
                            }}
                        />
                    ) : (
                        <DocModal
                            key="modal"
                            doc={selected}
                            showContent={showContent}
                            setShowContent={setShowContent}
                            onClose={() => {
                                setSelected(null);
                                setShowContent(false);
                            }}
                        />
                    )
                )}
            </AnimatePresence>
        </div>
    );
}

function CategorySection({ category, docs, onOpen }: { category: string; docs: LibraryDoc[]; onOpen: (d: LibraryDoc) => void }) {
    const [expanded, setExpanded] = useState(false);
    const meta = getCategoryMeta(category);
    const Icon = meta.icon;
    const visible = expanded ? docs : docs.slice(0, 3);

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                    <span className={`w-8 h-8 rounded-xl ${meta.bg} flex items-center justify-center shadow-sm`}>
                        <Icon size={14} className={meta.color} />
                    </span>
                    {category}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">{docs.length}</span>
                </h2>
                {docs.length > 3 && (
                    <button onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider">
                        {expanded ? 'Fewer' : `Display all ${docs.length}`}
                        <ChevronRight size={13} className={`transition-transform duration-300 ${expanded ? '-rotate-90' : 'rotate-90'}`} />
                    </button>
                )}
            </div>
            <div className="space-y-3">
                {visible.map(doc => <DocRow key={doc._id} doc={doc} onOpen={onOpen} />)}
            </div>
            {!expanded && docs.length > 3 && (
                <div className="mt-2 h-0.5 bg-gradient-to-r from-teal-500/10 via-transparent to-transparent ml-10 rounded-full" />
            )}
        </section>
    );
}

function DocRow({ doc, onOpen }: { doc: LibraryDoc; onOpen: (d: LibraryDoc) => void }) {
    const fileMeta = getFileMeta(doc.file_type);
    const isRichText = doc.file_type === 'rich-text' || doc.file_type === 'rich_text';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            whileHover={{ x: 2, borderColor: 'rgb(20 184 166 / 0.3)' }}
            onClick={() => onOpen(doc)}
            className="group bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all duration-300 relative overflow-hidden"
        >
            <div className="absolute inset-y-0 left-0 w-1 bg-teal-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />

            <div className={`w-11 h-11 rounded-2xl ${fileMeta.bg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <FileText size={20} className={fileMeta.color} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-[14px] leading-tight truncate group-hover:text-teal-700 transition-colors uppercase tracking-tight">{doc.title}</h3>
                    {doc.is_common && (
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 flex-shrink-0">Foundation</span>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 font-medium truncate uppercase tracking-tighter">
                        {doc.program ? `${doc.program.code}: ${doc.program.name}` : 'Institutional Resource'}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right hidden md:block mr-2">
                    <p className="text-[9px] uppercase font-bold text-gray-300 tracking-widest mb-0.5">{fileMeta.label}</p>
                    <p className="text-[11px] font-semibold text-gray-400 tabular-nums">{formatDate(doc.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); onOpen(doc); }}
                        className="text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl bg-gray-50 text-gray-600 border border-gray-100 group-hover:bg-teal-50 group-hover:text-teal-600 group-hover:border-teal-100 transition-all">
                        {isRichText ? 'Book' : 'View'}
                    </button>
                    {!isRichText && doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" download
                            onClick={e => e.stopPropagation()}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition shadow-sm">
                            <Download size={14} />
                        </a>
                    )}
                </div>
                <ChevronRight size={13} className="text-gray-300" />
            </div>
        </motion.div>
    );
}

function DocModal({ doc, showContent, setShowContent, onClose }: {
    doc: LibraryDoc; showContent: boolean; setShowContent: (v: boolean) => void; onClose: () => void;
}) {
    const fileMeta = getFileMeta(doc.file_type);
    const catMeta = getCategoryMeta(doc.category);
    const CatIcon = catMeta.icon;
    const isRichText = doc.file_type === 'rich-text' || doc.file_type === 'rich_text';
    // Robust Markdown detection: Check file_type OR if content starts with a Markdown header
    const contentStr = (doc.content || '').trim();
    const isMarkdown = doc.file_type === 'md' || doc.file_type === 'markdown' ||
        doc.url?.toLowerCase().endsWith('.md') ||
        /^(#|---|\*|-|\d+\.|>|\[.*\]\(.*\))/.test(contentStr) ||
        contentStr.includes('**') ||
        contentStr.includes('##') ||
        contentStr.includes('###');

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-8 pt-8 pb-6 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className={`w-14 h-14 rounded-2xl ${fileMeta.bg} flex items-center justify-center flex-shrink-0 shadow-sm border border-white`}>
                                <FileText size={24} className={fileMeta.color} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-black text-gray-900 text-xl leading-tight uppercase tracking-tight">{doc.title}</h2>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${catMeta.bg} ${catMeta.color}`}>
                                        <CatIcon size={10} /> {doc.category}
                                    </span>
                                    {doc.current_version && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-400">v{doc.current_version}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-red-500 p-2 rounded-2xl hover:bg-red-50 transition-all">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-8 py-6">
                        <div className="mb-6 p-4 bg-teal-50/50 rounded-2xl border border-teal-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white">
                                    <BookMarked size={14} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-teal-600 uppercase tracking-widest">Resource Course</p>
                                    <p className="text-sm font-bold text-gray-700">{doc.program ? `${doc.program.code} (${doc.program.name})` : 'Foundation Resource'}</p>
                                </div>
                            </div>
                        </div>

                        {doc.description && (
                            <div className="mb-6">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Document Details</p>
                                <p className="text-sm text-gray-600 leading-relaxed font-medium">{doc.description}</p>
                            </div>
                        )}

                        {/* Rendering Area - High Quality Preview */}
                        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[120px]">
                            {(isRichText || isMarkdown) ? (
                                <div className="p-8 prose prose-teal max-w-none">
                                    <div className="flex items-center gap-3 mb-4 text-teal-600">
                                        <BookOpen size={18} />
                                        <span className="text-xs font-bold uppercase tracking-widest">Immersive Reader Content</span>
                                    </div>
                                    <div className="line-clamp-6 text-gray-600 leading-relaxed font-serif text-sm">
                                        {isMarkdown ? (
                                            <ReactMarkdown>{doc.content.substring(0, 500) + '...'}</ReactMarkdown>
                                        ) : (
                                            <div dangerouslySetInnerHTML={{ __html: doc.content.substring(0, 800) + '...' }} />
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-center">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest italic text-center">
                                            This is a premium scholarly book. Launch the immersive reader below to view the full content and navigation.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-12 text-center bg-gray-50/50">
                                    <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Digital Download Available</p>
                                    <p className="text-xs text-gray-400 mt-2">This is a {fileMeta.label} document. You can download it to view the contents.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 border-t border-gray-50 flex items-center gap-3 bg-white">
                    {(isRichText || isMarkdown) ? (
                        <button
                            onClick={() => setShowContent(true)}
                            className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 transition-all shadow-lg shadow-teal-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <BookOpen size={16} /> Launch Immersive Reader
                        </button>
                    ) : doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" download
                            className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <Download size={16} /> Download {fileMeta.label}
                        </a>
                    )}
                    <button onClick={onClose} className="px-6 py-4 border border-gray-200 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-gray-400 hover:bg-gray-50 transition-all">
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}


