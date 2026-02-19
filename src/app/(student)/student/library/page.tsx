'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Search, Filter, FileText, Download, X, BookOpen } from 'lucide-react';

interface LibraryDoc {
    _id: string;
    title: string;
    description: string;
    url: string;
    file_size: number;
    file_type: string;
    category: string;
    createdAt: string;
}

const CATEGORIES = [
    { value: 'all', label: 'All Documents' },
    { value: 'general', label: 'General' },
    { value: 'syllabus', label: 'Syllabus' },
    { value: 'study_material', label: 'Study Material' },
    { value: 'reference', label: 'Reference Books' },
    { value: 'assignment', label: 'Assignments' },
];

function formatSize(bytes: number) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function Library() {
    const { status } = useSession();
    const router = useRouter();
    const [documents, setDocuments] = useState<LibraryDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [selected, setSelected] = useState<LibraryDoc | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetch('/api/student/library')
            .then(res => res.json())
            .then(d => {
                if (d.success) setDocuments(d.documents);
                else setError('Failed to load library');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, [status]);

    const filtered = documents.filter(d => {
        const matchCat = category === 'all' || d.category === category;
        const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    if (loading) return (
        <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="text-blue-600" size={24} /> Library
                </h1>
                <p className="text-gray-500 text-sm mt-1">Access study materials and resources uploaded by your institution.</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
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
                        {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
            </div>

            {error && <div className="text-red-600 bg-red-50 p-4 rounded-xl text-sm">{error}</div>}

            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center text-gray-400">
                    <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-medium text-gray-500">No documents found</p>
                    <p className="text-sm mt-1">{search || category !== 'all' ? 'Try different filters.' : 'No resources have been uploaded yet.'}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map(doc => (
                        <motion.div key={doc._id} whileHover={{ y: -4 }}
                            className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setSelected(doc)}>
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <FileText className="text-blue-600 flex-shrink-0" size={30} />
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 capitalize">
                                        {doc.category.replace('_', ' ')}
                                    </span>
                                </div>
                                <h3 className="font-bold text-gray-900 truncate mb-1" title={doc.title}>{doc.title}</h3>
                                {doc.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{doc.description}</p>}
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>{formatSize(doc.file_size)}</span>
                                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                                <button className="w-full py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 transition">
                                    <Download size={14} /> View / Download
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Preview Modal */}
            {selected && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-xl max-w-lg w-full p-6 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-1 pr-8">{selected.title}</h2>
                        {selected.description && <p className="text-gray-500 text-sm mb-4">{selected.description}</p>}
                        <div className="grid grid-cols-2 gap-3 text-xs text-gray-500 mb-5 bg-gray-50 p-3 rounded-lg">
                            <div><span className="font-medium">Category:</span> {selected.category.replace('_', ' ')}</div>
                            <div><span className="font-medium">Size:</span> {formatSize(selected.file_size)}</div>
                            <div><span className="font-medium">Type:</span> {selected.file_type}</div>
                            <div><span className="font-medium">Uploaded:</span> {new Date(selected.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setSelected(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">Close</button>
                            <a href={selected.url} target="_blank" rel="noopener noreferrer" download
                                className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                <Download size={15} /> Download
                            </a>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
