'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, AlertTriangle, Info, BookOpen } from 'lucide-react';

interface Notice {
    _id: string;
    title: string;
    content: string;
    category: string;
    priority: 'low' | 'normal' | 'high';
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

const Notices: React.FC = () => {
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetch('/api/public/notices')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setNotices(data.notices || []);
                } else {
                    setNotices([]);
                }
            })
            .catch(err => {
                console.error(err);
                setError('Error connecting to server. Please try again later.');
                setNotices([]);
            })
            .finally(() => setLoading(false));
    }, []);

    const filtered = filter === 'all' ? notices : notices.filter(n => n.category === filter);

    const categories = ['all', ...Array.from(new Set(notices.map(n => n.category)))];

    return (
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
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition border ${filter === cat
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                    }`}
                            >
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
                        {filtered.map((notice, index) => (
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
                                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize flex-shrink-0 ${categoryBadge[notice.category] || 'bg-gray-100 text-gray-600'}`}>
                                            {categoryIcon(notice.category)}
                                            {notice.category}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>
                                    <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                        {notice.content}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notices;
