'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
    Search, ChevronDown, ChevronRight, CheckCircle2, Lightbulb,
    AlertTriangle, BookOpen, Clock, X, Info, FileDown, GitBranch,
    List, ChevronUp,
} from 'lucide-react';
import type { Category, Article } from '@/data/helpContent';

const MermaidDiagram = dynamic(() => import('./MermaidDiagram'), { ssr: false });

type Role = 'admin' | 'student' | 'teacher';

const THEME: Record<Role, {
    accent: string; sidebar: string; badge: string;
    activeCat: string; activeLink: string; stepBg: string;
    overviewBg: string; overviewBorder: string; overviewText: string;
}> = {
    admin: {
        accent: 'text-blue-700', sidebar: 'bg-gray-900',
        badge: 'bg-blue-100 text-blue-700', activeCat: 'text-blue-400',
        activeLink: 'bg-blue-600 text-white', stepBg: 'bg-blue-600',
        overviewBg: 'bg-blue-50', overviewBorder: 'border-blue-200', overviewText: 'text-blue-800',
    },
    student: {
        accent: 'text-indigo-700', sidebar: 'bg-indigo-950',
        badge: 'bg-indigo-100 text-indigo-700', activeCat: 'text-indigo-400',
        activeLink: 'bg-indigo-600 text-white', stepBg: 'bg-indigo-600',
        overviewBg: 'bg-indigo-50', overviewBorder: 'border-indigo-200', overviewText: 'text-indigo-800',
    },
    teacher: {
        accent: 'text-amber-700', sidebar: 'bg-amber-950',
        badge: 'bg-amber-100 text-amber-700', activeCat: 'text-amber-400',
        activeLink: 'bg-amber-600 text-white', stepBg: 'bg-amber-600',
        overviewBg: 'bg-amber-50', overviewBorder: 'border-amber-200', overviewText: 'text-amber-800',
    },
};

function fmt(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props { role: Role; categories: Category[]; roleLabel: string; }

export default function HelpPage({ role, categories, roleLabel }: Props) {
    const t = THEME[role];
    const printRef = useRef<HTMLDivElement>(null);

    const [search, setSearch] = useState('');
    const [openCats, setOpenCats] = useState<Set<string>>(() => new Set(categories.map(c => c.id)));
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(categories[0]?.articles[0]?.id ?? null);
    const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());
    const [showDiagram, setShowDiagram] = useState(true);
    const [pdfLoading, setPdfLoading] = useState(false);

    const searchResults = useMemo(() => {
        if (!search.trim()) return [] as Article[];
        const q = search.toLowerCase();
        const out: Article[] = [];
        for (const cat of categories)
            for (const a of cat.articles)
                if (a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q) ||
                    a.steps.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)))
                    out.push(a);
        return out;
    }, [search, categories]);

    const selectedArticle = useMemo(() => {
        for (const cat of categories) {
            const a = cat.articles.find(a => a.id === selectedArticleId);
            if (a) return a;
        }
        return null;
    }, [selectedArticleId, categories]);

    const toggleCat = (id: string) => setOpenCats(prev => {
        const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
    });
    const toggleStep = (n: number) => setOpenSteps(prev => {
        const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s;
    });
    const selectArticle = (id: string) => { setSelectedArticleId(id); setOpenSteps(new Set()); setSearch(''); };

    const downloadPDF = useCallback(async () => {
        if (!selectedArticle) return;
        setPdfLoading(true);
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const el = printRef.current;
            if (!el) return;
            await html2pdf().set({
                margin: [12, 14, 12, 14],
                filename: `${selectedArticle.title.replace(/[^a-z0-9]/gi, '_')}_LDM_Help.pdf`,
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
            }).from(el).save();
        } finally {
            setPdfLoading(false);
        }
    }, [selectedArticle]);

    return (
        <div className="flex h-[calc(100vh-2rem)] rounded-2xl border border-gray-200 overflow-hidden shadow-xl bg-white">

            {/* ── Sidebar ── */}
            <aside className={`w-72 flex-shrink-0 ${t.sidebar} text-white flex flex-col`}>
                <div className="px-5 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5 text-white/60" />
                        <div>
                            <p className="font-bold text-sm">{roleLabel} Help Centre</p>
                            <p className="text-[11px] text-white/40">SOPs & Step-by-Step Guides</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-3 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search guides…"
                            className="w-full bg-white/10 text-white placeholder:text-white/30 text-sm pl-8 pr-8 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-white/30" />
                        {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <X className="w-3.5 h-3.5 text-white/40 hover:text-white" /></button>}
                    </div>
                </div>

                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                    {search.trim() ? (
                        <>
                            <p className="text-[11px] text-white/40 px-3 py-1">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                            {searchResults.length === 0 && <p className="text-xs text-white/30 px-3 py-2">No matches found.</p>}
                            {searchResults.map(a => (
                                <button key={a.id} onClick={() => selectArticle(a.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedArticleId === a.id ? t.activeLink : 'text-white/70 hover:bg-white/10'}`}>
                                    {a.title}
                                </button>
                            ))}
                        </>
                    ) : categories.map(cat => (
                        <div key={cat.id}>
                            <button onClick={() => toggleCat(cat.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors ${openCats.has(cat.id) ? t.activeCat : 'text-white/40 hover:text-white/60'}`}>
                                <span className="flex items-center gap-1.5"><span>{cat.icon}</span>{cat.label}</span>
                                {openCats.has(cat.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            {openCats.has(cat.id) && (
                                <div className="mt-0.5 mb-1 space-y-0.5">
                                    {cat.articles.map(a => (
                                        <button key={a.id} onClick={() => selectArticle(a.id)}
                                            className={`w-full text-left pl-7 pr-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedArticleId === a.id ? t.activeLink : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                                            {a.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="px-4 py-3 border-t border-white/10">
                    <p className="text-[11px] text-white/30 text-center">LDM College ERP Help Centre</p>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
                {selectedArticle ? (
                    <div className="max-w-3xl mx-auto px-8 py-8 space-y-5">

                        {/* Header card */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm print:shadow-none">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <h1 className={`text-2xl font-extrabold ${t.accent} leading-tight`}>{selectedArticle.title}</h1>
                                    <p className="mt-1.5 text-gray-500 text-sm leading-relaxed">{selectedArticle.summary}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${t.badge}`}>
                                    <Clock className="w-3 h-3" />Updated {fmt(selectedArticle.lastUpdated)}
                                </div>
                            </div>

                            {/* stat row */}
                            <div className="mt-4 flex items-center gap-5 text-xs text-gray-400 flex-wrap">
                                <span className="flex items-center gap-1"><List className="w-3.5 h-3.5" />{selectedArticle.steps.length} Steps</span>
                                {selectedArticle.flowDiagram && <span className="flex items-center gap-1"><GitBranch className="w-3.5 h-3.5" />Flow Diagram included</span>}
                                {selectedArticle.relatedIds?.length ? <span>{selectedArticle.relatedIds.length} Related Guide{selectedArticle.relatedIds.length !== 1 ? 's' : ''}</span> : null}
                            </div>

                            {/* Action row */}
                            <div className="mt-4 flex gap-2 flex-wrap">
                                <button onClick={() => setOpenSteps(new Set(selectedArticle.steps.map(s => s.step)))}
                                    className="text-xs text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5">
                                    <ChevronDown className="w-3.5 h-3.5" />Expand All
                                </button>
                                <button onClick={() => setOpenSteps(new Set())}
                                    className="text-xs text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5">
                                    <ChevronUp className="w-3.5 h-3.5" />Collapse All
                                </button>
                                {selectedArticle.flowDiagram && (
                                    <button onClick={() => setShowDiagram(d => !d)}
                                        className="text-xs text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1.5">
                                        <GitBranch className="w-3.5 h-3.5" />{showDiagram ? 'Hide' : 'Show'} Flow Diagram
                                    </button>
                                )}
                                <button onClick={downloadPDF} disabled={pdfLoading}
                                    className="text-xs font-medium px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-60">
                                    <FileDown className="w-3.5 h-3.5" />{pdfLoading ? 'Generating…' : 'Download PDF'}
                                </button>
                            </div>
                        </div>

                        {/* PDF-printable content */}
                        <div ref={printRef} className="space-y-5">

                            {/* PDF header (only visible in PDF) */}
                            <div className="hidden pdf-header">
                                <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selectedArticle.title}</h1>
                                <p style={{ fontSize: 12, color: '#6b7280' }}>{selectedArticle.summary}</p>
                                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                                    LDM College ERP | {roleLabel} Help Centre | Last updated: {fmt(selectedArticle.lastUpdated)}
                                </p>
                                <hr style={{ margin: '12px 0', borderColor: '#e5e7eb' }} />
                            </div>

                            {/* Overview bullets */}
                            {selectedArticle.overview && selectedArticle.overview.length > 0 && (
                                <div className={`rounded-xl border ${t.overviewBorder} ${t.overviewBg} px-5 py-4`}>
                                    <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${t.overviewText}`}>Key Facts</p>
                                    <ul className="space-y-1.5">
                                        {selectedArticle.overview.map((pt, i) => (
                                            <li key={i} className={`flex items-start gap-2 text-sm ${t.overviewText}`}>
                                                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-70" />
                                                {pt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Flow diagram */}
                            {selectedArticle.flowDiagram && showDiagram && (
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4 text-sm font-bold text-gray-700">
                                        <GitBranch className="w-4 h-4 text-gray-500" />Process Flow Diagram
                                    </div>
                                    <MermaidDiagram definition={selectedArticle.flowDiagram} id={selectedArticle.id} />
                                    <p className="text-xs text-gray-400 text-center mt-3">Read left-to-right / top-to-bottom. Diamonds (◇) are decision points.</p>
                                </div>
                            )}

                            {/* Steps */}
                            <div className="space-y-3">
                                {selectedArticle.steps.map(s => {
                                    const open = openSteps.has(s.step);
                                    return (
                                        <div key={s.step} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                            <button onClick={() => toggleStep(s.step)}
                                                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                                                <div className={`w-8 h-8 rounded-full ${t.stepBg} text-white text-sm font-extrabold flex items-center justify-center flex-shrink-0`}>
                                                    {s.step}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                                                    {!open && <p className="text-gray-400 text-xs truncate mt-0.5">{s.description.slice(0, 90)}…</p>}
                                                </div>
                                                {open ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                            </button>

                                            {open && (
                                                <div className="px-5 pb-5 border-t border-gray-100 space-y-3 mt-0">
                                                    <p className="text-gray-700 text-sm leading-relaxed mt-3">{s.description}</p>

                                                    {s.detail && (
                                                        <p className="text-gray-600 text-sm leading-relaxed pl-3 border-l-2 border-gray-200">{s.detail}</p>
                                                    )}

                                                    {s.note && (
                                                        <div className="flex items-start gap-2.5 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm">
                                                            <Info className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                                                            <p className="text-sky-800">{s.note}</p>
                                                        </div>
                                                    )}
                                                    {s.tip && (
                                                        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                                                            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                            <p className="text-amber-800"><span className="font-semibold">Tip: </span>{s.tip}</p>
                                                        </div>
                                                    )}
                                                    {s.warning && (
                                                        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                                                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                            <p className="text-red-800"><span className="font-semibold">Warning: </span>{s.warning}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Related guides */}
                            {(() => {
                                if (!selectedArticle.relatedIds?.length) return null;
                                const related: Article[] = [];
                                for (const cat of categories)
                                    for (const a of cat.articles)
                                        if (selectedArticle.relatedIds!.includes(a.id)) related.push(a);
                                if (!related.length) return null;
                                return (
                                    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                        <h3 className="text-sm font-bold text-gray-700 mb-3">Related Guides</h3>
                                        <div className="space-y-2">
                                            {related.map(a => (
                                                <button key={a.id} onClick={() => selectArticle(a.id)}
                                                    className="w-full text-left flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm transition-colors">
                                                    <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-800">{a.title}</p>
                                                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.summary}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-3">
                            <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
                            <p className="text-gray-400 text-sm">Select a guide from the left panel to get started.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
