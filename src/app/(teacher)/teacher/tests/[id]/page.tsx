'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface AttemptStudent {
    _id: string;
    fullName: string;
    email: string;
    rollNumber?: string;
}

interface Attempt {
    _id: string;
    studentId: AttemptStudent;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    submittedAt: string;
    resultVisible: boolean;
}

interface TestDetail {
    _id: string;
    title: string;
    description?: string;
    durationMinutes: number;
    totalMarks: number;
    negativeMarking: number;
    resultMode: 'instant' | 'manual';
    isPublished: boolean;
    isActive: boolean;
    isLocked: boolean;
    academicYear?: string;
    batch?: { _id: string; name: string };
    subject?: { _id: string; name: string; code: string };
    questionCount?: number;
    questions?: { questionId: string; questionText: string; marks: number }[];
    createdAt: string;
}

export default function TeacherTestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [testId, setTestId] = useState('');
    const [test, setTest] = useState<TestDetail | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { params.then(p => setTestId(p.id)); }, [params]);

    useEffect(() => {
        if (!testId) return;
        fetch(`/api/admin/tests/${testId}`)
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    setTest(d.test);
                    setAttempts(d.attempts ?? []);
                } else {
                    setError(d.message || 'Test not found');
                }
            })
            .catch(() => setError('Failed to load'))
            .finally(() => setLoading(false));
    }, [testId]);

    const publishResults = async () => {
        if (!confirm('Publish all results? Students will be able to see their scores and answer breakdowns.')) return;
        setPublishing(true);
        try {
            const res = await fetch(`/api/admin/tests/${testId}/publish`, { method: 'PATCH' });
            const data = await res.json();
            if (data.success) {
                setTest(prev => prev ? { ...prev, isPublished: true } : null);
                setAttempts(prev => prev.map(a => ({ ...a, resultVisible: true })));
            }
        } catch { /* ignore */ }
        setPublishing(false);
    };

    if (loading) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
    );
    if (error) return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <p className="text-red-600 font-semibold">{error}</p>
            <Link href="/teacher/tests" className="text-sm text-blue-600 hover:underline">← Back to Tests</Link>
        </div>
    );
    if (!test) return null;

    const avgPercentage = attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
        : 0;
    const highestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.marksObtained)) : 0;
    const lowestScore = attempts.length > 0 ? Math.min(...attempts.map(a => a.marksObtained)) : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <Link href="/teacher/tests" className="text-xs text-blue-600 hover:underline mb-1 inline-block">← All Tests</Link>
                    <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
                    {test.description && <p className="text-gray-500 text-sm mt-0.5">{test.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {test.isLocked && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">🔒 Locked</span>
                    )}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {test.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {test.resultMode === 'manual' && (
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${test.isPublished ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {test.isPublished ? '✓ Published' : '⏳ Unpublished'}
                        </span>
                    )}
                </div>
            </div>

            {/* Meta Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Duration', value: `${test.durationMinutes} min`, icon: '⏱' },
                    { label: 'Total Marks', value: `${test.totalMarks}`, icon: '📝' },
                    { label: 'Questions', value: `${test.questionCount ?? test.questions?.length ?? 0}`, icon: '❓' },
                    { label: 'Attempts', value: `${attempts.length}`, icon: '👥' },
                ].map((card, i) => (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
                        <p className="text-2xl mb-1">{card.icon}</p>
                        <p className="text-lg font-bold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-400">{card.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Details Row */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="text-gray-400 text-xs">Subject</p>
                        <p className="font-semibold text-gray-900">{test.subject?.name ?? '—'} {test.subject?.code ? `(${test.subject.code})` : ''}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Batch</p>
                        <p className="font-semibold text-gray-900">{test.batch?.name ?? '—'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Negative Marking</p>
                        <p className="font-semibold text-gray-900">{test.negativeMarking > 0 ? `−${test.negativeMarking}` : 'None'}</p>
                    </div>
                    <div>
                        <p className="text-gray-400 text-xs">Academic Year</p>
                        <p className="font-semibold text-gray-900">{test.academicYear ?? '—'}</p>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            {attempts.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
                    <h2 className="font-bold text-gray-900 mb-3">📊 Statistics</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-blue-700">{avgPercentage}%</p>
                            <p className="text-xs text-gray-500">Avg Score</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-700">{highestScore}/{test.totalMarks}</p>
                            <p className="text-xs text-gray-500">Highest</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{lowestScore}/{test.totalMarks}</p>
                            <p className="text-xs text-gray-500">Lowest</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Publish Results Button — only for manual mode, unpublished */}
            {test.resultMode === 'manual' && !test.isPublished && attempts.length > 0 && (
                <button onClick={publishResults} disabled={publishing}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg hover:shadow-green-200 transition-all disabled:opacity-60">
                    {publishing ? 'Publishing…' : `📢 Publish Results for ${attempts.length} Student(s)`}
                </button>
            )}

            {/* Attempts Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Student Attempts</h2>
                </div>
                {attempts.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                        <p className="text-3xl mb-2">📭</p>
                        <p className="font-medium">No one has attempted this test yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">#</th>
                                    <th className="px-4 py-3 text-left">Student</th>
                                    <th className="px-4 py-3 text-left">Roll No</th>
                                    <th className="px-4 py-3 text-center">Score</th>
                                    <th className="px-4 py-3 text-center">%</th>
                                    <th className="px-4 py-3 text-center">✓</th>
                                    <th className="px-4 py-3 text-center">✗</th>
                                    <th className="px-4 py-3 text-center">—</th>
                                    <th className="px-4 py-3 text-left">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {attempts.map((att, i) => (
                                    <motion.tr key={att._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-900">{att.studentId?.fullName ?? 'Unknown'}</p>
                                            <p className="text-xs text-gray-400">{att.studentId?.email ?? ''}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{att.studentId?.rollNumber ?? '—'}</td>
                                        <td className="px-4 py-3 text-center font-bold text-gray-900">{att.marksObtained}/{att.totalMarks}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${att.percentage >= 60 ? 'bg-green-100 text-green-700' :
                                                att.percentage >= 33 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-600'
                                                }`}>
                                                {att.percentage}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-green-600 font-semibold">{att.correctCount}</td>
                                        <td className="px-4 py-3 text-center text-red-500 font-semibold">{att.wrongCount}</td>
                                        <td className="px-4 py-3 text-center text-gray-400">{att.skippedCount}</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(att.submittedAt).toLocaleString('en-IN')}</td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
