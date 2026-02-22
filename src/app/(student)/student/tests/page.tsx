'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface TestCard { _id: string; title: string; duration: number; questionCount: number; createdAt: string; attempted: boolean; score: number | null; percentage: number | null; }

export default function StudentTestsPage() {
    const { status } = useSession();
    const [tests, setTests] = useState<TestCard[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            fetch('/api/student/tests').then(r => r.json()).then(d => { if (d.success) setTests(d.tests); setLoading(false); });
        }
    }, [status]);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">📝 Available Tests</h1>
                <p className="text-gray-500 text-sm mt-1">Complete the tests assigned by your teachers.</p>
            </div>
            {tests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <p className="text-4xl mb-3">🎉</p>
                    <p className="text-gray-500">No tests available right now. Check back later!</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {tests.map(test => (
                        <div key={test._id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${test.attempted ? 'border-green-200' : 'border-gray-100 hover:border-blue-200 hover:shadow-md'}`}>
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-bold text-gray-900 leading-tight">{test.title}</h3>
                                {test.attempted && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ml-2">Done ✓</span>
                                )}
                            </div>
                            <div className="flex gap-4 text-xs text-gray-500 mb-4">
                                <span>⏱ {test.duration} min</span>
                                <span>❓ {test.questionCount} questions</span>
                            </div>
                            {test.attempted ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{test.score}/{test.questionCount} correct</p>
                                        <p className={`text-xs font-semibold ${(test.percentage ?? 0) >= 60 ? 'text-green-600' : 'text-red-500'}`}>{test.percentage}%</p>
                                    </div>
                                    <Link href={`/student/tests/${test._id}/result`} className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-colors">
                                        View Result
                                    </Link>
                                </div>
                            ) : (
                                <Link href={`/student/tests/${test._id}`} className="block w-full text-center py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                                    Start Test →
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
