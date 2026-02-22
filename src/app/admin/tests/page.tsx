'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface TestItem {
    _id: string;
    title: string;
    duration: number;
    isActive: boolean;
    questions: { length?: number } | unknown[];
    attemptCount: number;
    createdAt: string;
}

export default function AdminTestsPage() {
    const [tests, setTests] = useState<TestItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTests = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/tests');
        const data = await res.json();
        if (data.success) setTests(data.tests);
        setLoading(false);
    };

    useEffect(() => { fetchTests(); }, []);

    const toggleActive = async (id: string, current: boolean) => {
        await fetch(`/api/admin/tests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !current }),
        });
        fetchTests();
    };

    const deleteTest = async (id: string, title: string) => {
        if (!confirm(`Delete test "${title}"? This will also remove all student attempts.`)) return;
        await fetch(`/api/admin/tests/${id}`, { method: 'DELETE' });
        fetchTests();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">MCQ Tests</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage all tests and view student results.</p>
                </div>
                <Link href="/admin/tests/create" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-blue-200 transition-all">
                    + Create Test
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>
            ) : tests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-4xl mb-3">📝</p>
                    <p className="text-gray-500 font-medium">No tests yet.</p>
                    <Link href="/admin/tests/create" className="mt-4 inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">Create your first test</Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tests.map((test, i) => {
                        const qCount = Array.isArray(test.questions) ? test.questions.length : 0;
                        return (
                            <motion.div
                                key={test._id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <h3 className="font-bold text-gray-900">{test.title}</h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {test.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
                                        <span>⏱ {test.duration} min</span>
                                        <span>❓ {qCount} question{qCount !== 1 ? 's' : ''}</span>
                                        <span>👥 {test.attemptCount} attempt{test.attemptCount !== 1 ? 's' : ''}</span>
                                        <span>📅 {new Date(test.createdAt).toLocaleDateString('en-IN')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link href={`/admin/tests/${test._id}`} className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors">
                                        View Results
                                    </Link>
                                    <button onClick={() => toggleActive(test._id, test.isActive)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${test.isActive ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                                        {test.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                    <button onClick={() => deleteTest(test._id, test.title)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
