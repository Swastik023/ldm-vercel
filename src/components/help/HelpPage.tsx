'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, CheckCircle2, Lightbulb, AlertTriangle, BookOpen, Clock, X } from 'lucide-react';
import type { Category, Article } from '@/data/helpContent';

type Role = 'admin' | 'student' | 'teacher';

const ROLE_THEME: Record<Role, { primary: string; sidebar: string; badge: string; activeCat: string; activeLink: string; step: string }> = {
    admin: {
        primary: 'text-blue-700',
        sidebar: 'bg-gray-900',
        badge: 'bg-blue-100 text-blue-700',
        activeCat: 'text-blue-400',
        activeLink: 'bg-blue-600 text-white',
        step: 'bg-blue-600',
    },
    student: {
        primary: 'text-indigo-700',
        sidebar: 'bg-indigo-950',
        badge: 'bg-indigo-100 text-indigo-700',
        activeCat: 'text-indigo-400',
        activeLink: 'bg-indigo-600 text-white',
        step: 'bg-indigo-600',
    },
    teacher: {
        primary: 'text-amber-700',
        sidebar: 'bg-amber-950',
        badge: 'bg-amber-100 text-amber-700',
        activeCat: 'text-amber-400',
        activeLink: 'bg-amber-600 text-white',
        step: 'bg-amber-600',
    },
};

interface Props {
    role: Role;
    categories: Category[];
    roleLabel: string;
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HelpPage({ role, categories, roleLabel }: Props) {
    const theme = ROLE_THEME[role];

    const [search, setSearch] = useState('');
    const [openCats, setOpenCats] = useState<Set<string>>(() => new Set(categories.map(c => c.id)));
    const [selectedArticleId, setSelectedArticleId] = useState<string | null>(categories[0]?.articles[0]?.id ?? null);
    const [openSteps, setOpenSteps] = useState<Set<number>>(new Set());

    // Search result sets
    const searchResults = useMemo((): Article[] => {
        if (!search.trim()) return [];
        const q = search.toLowerCase();
        const results: Article[] = [];
        for (const cat of categories) {
            for (const a of cat.articles) {
                if (
                    a.title.toLowerCase().includes(q) ||
                    a.summary.toLowerCase().includes(q) ||
                    a.steps.some(s => s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
                ) {
                    results.push(a);
                }
            }
        }
        return results;
    }, [search, categories]);

    const selectedArticle = useMemo(() => {
        for (const cat of categories) {
            const a = cat.articles.find(a => a.id === selectedArticleId);
            if (a) return a;
        }
        return null;
    }, [selectedArticleId, categories]);

    const toggleCat = (id: string) => setOpenCats(prev => {
        const s = new Set(prev);
        s.has(id) ? s.delete(id) : s.add(id);
        return s;
    });

    const toggleStep = (n: number) => setOpenSteps(prev => {
        const s = new Set(prev);
        s.has(n) ? s.delete(n) : s.add(n);
        return s;
    });

    const selectArticle = (id: string) => {
        setSelectedArticleId(id);
        setOpenSteps(new Set()); // collapse all steps when switching articles
        setSearch('');
    };

    return (
        <div className="flex h-[calc(100vh-2rem)] rounded-2xl border border-gray-200 overflow-hidden shadow-xl bg-white">
            {/* ── Left Nav ── */}
            <aside className={`w-72 flex-shrink-0 ${theme.sidebar} text-white flex flex-col`}>
                {/* Header */}
                <div className="px-5 py-5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                        <BookOpen className="w-5 h-5 text-white/70" />
                        <div>
                            <p className="font-bold text-sm text-white">{roleLabel} Help Centre</p>
                            <p className="text-xs text-white/40">Standard Operating Procedures</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-white/10">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search guides…"
                            className="w-full bg-white/10 text-white placeholder:text-white/30 text-sm pl-8 pr-8 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-white/30"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                <X className="w-3.5 h-3.5 text-white/40 hover:text-white" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Nav or search results */}
                <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                    {search.trim() ? (
                        <>
                            <p className="text-xs text-white/40 px-3 py-1">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                            {searchResults.length === 0 && (
                                <p className="text-xs text-white/30 px-3 py-2">No matches found.</p>
                            )}
                            {searchResults.map(a => (
                                <button key={a.id} onClick={() => selectArticle(a.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedArticleId === a.id ? theme.activeLink : 'text-white/70 hover:bg-white/10'}`}>
                                    {a.title}
                                </button>
                            ))}
                        </>
                    ) : (
                        categories.map(cat => (
                            <div key={cat.id}>
                                <button onClick={() => toggleCat(cat.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${openCats.has(cat.id) ? theme.activeCat : 'text-white/40 hover:text-white/60'}`}>
                                    <span className="flex items-center gap-1.5"><span>{cat.icon}</span>{cat.label}</span>
                                    {openCats.has(cat.id) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                </button>
                                {openCats.has(cat.id) && (
                                    <div className="mt-0.5 mb-1 space-y-0.5">
                                        {cat.articles.map(a => (
                                            <button key={a.id} onClick={() => selectArticle(a.id)}
                                                className={`w-full text-left pl-7 pr-3 py-2 rounded-lg text-xs font-medium transition-all ${selectedArticleId === a.id ? theme.activeLink : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                                                {a.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </nav>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-white/10">
                    <p className="text-xs text-white/30 text-center">LDM College ERP • v1.0</p>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
                {selectedArticle ? (
                    <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
                        {/* Article Header */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className={`text-2xl font-extrabold ${theme.primary} leading-tight`}>{selectedArticle.title}</h1>
                                    <p className="mt-2 text-gray-500 text-sm leading-relaxed">{selectedArticle.summary}</p>
                                </div>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${theme.badge}`}>
                                    <Clock className="w-3 h-3" />
                                    {formatDate(selectedArticle.lastUpdated)}
                                </div>
                            </div>

                            {/* Quick stats */}
                            <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />{selectedArticle.steps.length} Steps</span>
                                {selectedArticle.relatedIds?.length && (
                                    <span>{selectedArticle.relatedIds.length} Related Guide{selectedArticle.relatedIds.length !== 1 ? 's' : ''}</span>
                                )}
                            </div>

                            {/* Expand / Collapse all */}
                            <div className="mt-4 flex gap-2">
                                <button onClick={() => setOpenSteps(new Set(selectedArticle.steps.map(s => s.step)))}
                                    className="text-xs text-gray-500 hover:text-gray-800 font-medium px-3 py-1.5 bg-gray-100 rounded-lg transition-colors">
                                    Expand All Steps
                                </button>
                                <button onClick={() => setOpenSteps(new Set())}
                                    className="text-xs text-gray-500 hover:text-gray-800 font-medium px-3 py-1.5 bg-gray-100 rounded-lg transition-colors">
                                    Collapse All
                                </button>
                            </div>
                        </div>

                        {/* Steps */}
                        <div className="space-y-3">
                            {selectedArticle.steps.map(s => {
                                const isOpen = openSteps.has(s.step);
                                return (
                                    <div key={s.step} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all">
                                        <button
                                            onClick={() => toggleStep(s.step)}
                                            className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                                        >
                                            <div className={`w-8 h-8 rounded-full ${theme.step} text-white text-sm font-extrabold flex items-center justify-center flex-shrink-0`}>
                                                {s.step}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm">{s.title}</p>
                                                {!isOpen && <p className="text-gray-400 text-xs truncate mt-0.5">{s.description.slice(0, 80)}…</p>}
                                            </div>
                                            <div className="flex-shrink-0 text-gray-400">
                                                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </div>
                                        </button>

                                        {isOpen && (
                                            <div className="px-5 pb-5 border-t border-gray-100 space-y-3">
                                                <p className="text-gray-700 text-sm leading-relaxed mt-3">{s.description}</p>

                                                {s.tip && (
                                                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                                                        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-amber-800">{s.tip}</p>
                                                    </div>
                                                )}

                                                {s.warning && (
                                                    <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm">
                                                        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                        <p className="text-red-800">{s.warning}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Related Articles */}
                        {selectedArticle.relatedIds && selectedArticle.relatedIds.length > 0 && (() => {
                            const related: Article[] = [];
                            for (const cat of categories) {
                                for (const a of cat.articles) {
                                    if (selectedArticle.relatedIds!.includes(a.id)) related.push(a);
                                }
                            }
                            if (related.length === 0) return null;
                            return (
                                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3">Related Guides</h3>
                                    <div className="space-y-2">
                                        {related.map(a => (
                                            <button key={a.id} onClick={() => selectArticle(a.id)}
                                                className="w-full text-left flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm transition-colors">
                                                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="font-medium text-gray-800">{a.title}</span>
                                                <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-3">
                            <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
                            <p className="text-gray-400 text-sm">Select a guide from the left to get started.</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
