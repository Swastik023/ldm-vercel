'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface TestItem {
    _id: string;
    title: string;
    duration: number;
    isActive: boolean;
    questions: unknown[];
    attemptCount: number;
    createdAt: string;
}

export default function TeacherTestsPage() {
    const [tests, setTests] = useState<TestItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/admin/tests')
            .then(r => r.json())
            .then(d => {
                if (d.success) setTests(d.tests);
                else setError(d.message || 'Failed to load tests');
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    const toggleActive = async (id: string, current: boolean) => {
        await fetch(`/api/admin/tests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive: !current }),
        });
        // Refresh
        const res = await fetch('/api/admin/tests');
        const d = await res.json();
        if (d.success) setTests(d.tests);
    };

    if (loading) return (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600" /></div>
    );

    if (error) return <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">MCQ Tests</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage tests and track student attempts.</p>
                </div>
                <Link href="/admin/tests/create" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-orange-200 transition-all">
                    + Create Test
                </Link>
            </div>

            {tests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-4xl mb-3">📝</p>
                    <p className="text-gray-500 font-medium">No tests created yet.</p>
                    <Link href="/admin/tests/create" className="mt-4 inline-block px-6 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-semibold">Create your first test</Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {tests.map(test => {
                        const qCount = Array.isArray(test.questions) ? test.questions.length : 0;
                        return (
                            <div key={test._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
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
                                <div className="flex items-center gap-2">
                                    <Link href={`/admin/tests/${test._id}`} className="px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:border-amber-300 hover:text-amber-600 transition-colors">
                                        View Results
                                    </Link>
                                    <button onClick={() => toggleActive(test._id, test.isActive)} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${test.isActive ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                                        {test.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
