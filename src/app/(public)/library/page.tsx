'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, FileText, Download, X, BookOpen } from 'lucide-react';

interface LibraryDoc {
    _id: string;
    title: string;
    file_type: string;
    url: string;
    content: string;
    category: string;
    current_version: number;
    createdAt: string;
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PublicLibrary() {
    const [documents, setDocuments] = useState<LibraryDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [selected, setSelected] = useState<LibraryDoc | null>(null);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        fetch('/api/public/library')
            .then(r => r.json())
            .then(d => { if (d.success) setDocuments(d.documents); })
            .finally(() => setLoading(false));
    }, []);

    const allCategories = ['all', ...Array.from(new Set(documents.map(d => d.category)))];

    const filtered = documents.filter(d => {
        const matchCat = category === 'all' || d.category === category;
        const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3">E-Library</h1>
                    <p className="text-lg text-gray-600">Study materials and resources from LDM College</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search documents..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <select value={category} onChange={e => setCategory(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
                            {allCategories.map(c => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center p-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
                        <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-gray-500">No documents found</p>
                        <p className="text-sm mt-1">{search || category !== 'all' ? 'Try different filters.' : 'Resources will appear here once uploaded.'}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(doc => (
                            <motion.div key={doc._id} whileHover={{ y: -4 }}
                                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => { setSelected(doc); setShowContent(false); }}>
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <FileText className="text-blue-600 flex-shrink-0" size={30} />
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                                            {doc.category}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 truncate mb-1" title={doc.title}>{doc.title}</h3>
                                    <div className="flex justify-between items-center text-xs text-gray-400 mt-3">
                                        <span className="capitalize">{doc.file_type.replace('-', ' ')}</span>
                                        <span>{formatDate(doc.createdAt)}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                                    <button className="w-full py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition">
                                        {doc.file_type === 'rich-text' ? <><FileText size={14} /> Read</> : <><Download size={14} /> View / Download</>}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Preview Modal */}
                {selected && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={() => { setSelected(null); setShowContent(false); }}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 relative"
                            onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setSelected(null); setShowContent(false); }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                                <X size={20} />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900 mb-1 pr-8">{selected.title}</h2>
                            <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 mb-5 bg-gray-50 p-3 rounded-lg">
                                <div><span className="font-medium">Category:</span> {selected.category}</div>
                                <div><span className="font-medium">Type:</span> {selected.file_type}</div>
                                <div><span className="font-medium">Version:</span> v{selected.current_version}</div>
                                <div><span className="font-medium">Added:</span> {formatDate(selected.createdAt)}</div>
                            </div>
                            {selected.file_type === 'rich-text' ? (
                                showContent ? (
                                    <div className="prose max-w-none text-sm border-t pt-4 mt-2"
                                        dangerouslySetInnerHTML={{ __html: selected.content }} />
                                ) : (
                                    <button onClick={() => setShowContent(true)}
                                        className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                        <FileText size={15} /> Read Document
                                    </button>
                                )
                            ) : selected.url ? (
                                <a href={selected.url} target="_blank" rel="noopener noreferrer" download
                                    className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                    <Download size={15} /> Download
                                </a>
                            ) : (
                                <p className="text-center text-gray-400 text-sm">No downloadable content.</p>
                            )}
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
