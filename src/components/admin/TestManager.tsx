'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Trash2, ToggleLeft, ToggleRight, Eye, BarChart2, CheckCircle, XCircle, Clock, Upload, ChevronDown, ChevronUp, Users } from 'lucide-react';

interface TestSubject { _id: string; name: string; code: string; }
interface TestBatch { _id: string; name: string; }
interface AdminTestCard {
    _id: string;
    title: string;
    description?: string;
    durationMinutes: number;
    totalMarks: number;
    negativeMarking: number;
    questionCount: number;
    resultMode: 'instant' | 'manual';
    isPublished: boolean;
    isActive: boolean;
    attemptCount: number;
    subject: TestSubject;
    batch: TestBatch;
    createdAt: string;
}
interface AttemptRecord {
    _id: string;
    studentId: { fullName: string; email: string; rollNumber: string };
    marksObtained: number;
    totalMarks: number;
    percentage: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    submittedAt: string;
}

export default function TestManager() {
    const [tests, setTests] = useState<AdminTestCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [attempts, setAttempts] = useState<Record<string, AttemptRecord[]>>({});
    const [loadingAttempts, setLoadingAttempts] = useState<string | null>(null);
    const [publishing, setPublishing] = useState<string | null>(null);
    const [uploadErrors, setUploadErrors] = useState<string[]>([]);
    const [uploadWarnings, setUploadWarnings] = useState<string[]>([]);

    const qFileRef = useRef<HTMLInputElement>(null);
    const aFileRef = useRef<HTMLInputElement>(null);

    const load = useCallback(() => {
        setLoading(true);
        fetch('/api/admin/tests').then(r => r.json()).then(d => {
            if (d.success) setTests(d.tests);
            setLoading(false);
        });
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        const qFile = qFileRef.current?.files?.[0];
        const aFile = aFileRef.current?.files?.[0];
        if (!qFile || !aFile) { toast.error('Select both questions.json and answers.json'); return; }

        setUploading(true);
        setUploadErrors([]);
        setUploadWarnings([]);

        const fd = new FormData();
        fd.append('questions', qFile);
        fd.append('answers', aFile);

        const res = await fetch('/api/admin/tests', { method: 'POST', body: fd });
        const data = await res.json();
        setUploading(false);

        if (data.success) {
            toast.success(data.message || 'Test created!');
            if (data.warnings?.length) setUploadWarnings(data.warnings);
            if (qFileRef.current) qFileRef.current.value = '';
            if (aFileRef.current) aFileRef.current.value = '';
            load();
        } else {
            toast.error(data.message || 'Upload failed');
            if (data.errors?.length) setUploadErrors(data.errors);
        }
    };

    const toggleActive = async (id: string, current: boolean) => {
        const res = await fetch(`/api/admin/tests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !current }) });
        const d = await res.json();
        if (d.success) { setTests(ts => ts.map(t => t._id === id ? { ...t, isActive: !current } : t)); toast.success(`Test ${!current ? 'activated' : 'deactivated'}`); }
    };

    const deleteTest = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This will also delete all student attempts.\nThis cannot be undone.`)) return;
        const res = await fetch(`/api/admin/tests/${id}`, { method: 'DELETE' });
        const d = await res.json();
        if (d.success) { setTests(ts => ts.filter(t => t._id !== id)); toast.success('Test deleted'); }
        else toast.error(d.message || 'Delete failed');
    };

    const publishResults = async (id: string) => {
        if (!confirm('Publish results for all students who have submitted this test?')) return;
        setPublishing(id);
        const res = await fetch(`/api/admin/tests/${id}/publish`, { method: 'PATCH' });
        const d = await res.json();
        setPublishing(null);
        if (d.success) { setTests(ts => ts.map(t => t._id === id ? { ...t, isPublished: true } : t)); toast.success(d.message || 'Results published!'); }
        else toast.error(d.message || 'Failed to publish');
    };

    const loadAttempts = async (id: string) => {
        if (expandedId === id) { setExpandedId(null); return; }
        setExpandedId(id);
        if (attempts[id]) return;
        setLoadingAttempts(id);
        const res = await fetch(`/api/admin/tests/${id}`);
        const d = await res.json();
        if (d.success) setAttempts(prev => ({ ...prev, [id]: d.attempts }));
        setLoadingAttempts(null);
    };

    return (
        <div className="space-y-6">
            {/* Upload Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-600" />
                    Upload New Test
                </h2>
                <p className="text-xs text-gray-400 mb-5">Upload two JSON files — <code className="bg-gray-100 px-1 py-0.5 rounded">questions.json</code> and <code className="bg-gray-100 px-1 py-0.5 rounded">answers.json</code></p>

                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">questions.json *</label>
                            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                                <span className="text-2xl">📋</span>
                                <span className="text-sm text-gray-500 flex-1">Click to select</span>
                                <input ref={qFileRef} type="file" accept=".json" className="hidden" />
                            </label>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">answers.json *</label>
                            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all">
                                <span className="text-2xl">🔑</span>
                                <span className="text-sm text-gray-500 flex-1">Click to select</span>
                                <input ref={aFileRef} type="file" accept=".json" className="hidden" />
                            </label>
                        </div>
                    </div>

                    {/* Errors */}
                    {uploadErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-red-700 mb-2">❌ Validation Errors</p>
                            <ul className="space-y-1">
                                {uploadErrors.map((e, i) => <li key={i} className="text-xs text-red-600">• {e}</li>)}
                            </ul>
                        </div>
                    )}
                    {uploadWarnings.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <p className="text-xs font-bold text-yellow-700 mb-2">⚠ Warnings</p>
                            <ul className="space-y-1">
                                {uploadWarnings.map((w, i) => <li key={i} className="text-xs text-yellow-700">• {w}</li>)}
                            </ul>
                        </div>
                    )}

                    <button type="submit" disabled={uploading} className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl disabled:opacity-60 transition-colors">
                        {uploading ? 'Uploading & Validating…' : 'Upload & Create Test →'}
                    </button>
                </form>

                {/* Format hint */}
                <details className="mt-4">
                    <summary className="text-xs text-blue-600 cursor-pointer hover:underline">View required JSON format</summary>
                    <div className="mt-3 grid sm:grid-cols-2 gap-3">
                        <pre className="text-xs bg-gray-50 rounded-xl p-3 overflow-auto border border-gray-100">{`// questions.json
{
  "testMeta": {
    "title": "Math Quiz",
    "durationMinutes": 30,
    "totalMarks": 20,
    "batch": "<batchId>",
    "subject": "<subjectId>",
    "negativeMarking": 0.25,
    "shuffleQuestions": false,
    "shuffleOptions": false,
    "resultMode": "instant"
  },
  "sections": [
    { "sectionId": "S1", "title": "Algebra" }
  ],
  "questions": [{
    "questionId": "Q1",
    "sectionId": "S1",
    "type": "mcq",
    "questionText": "2 + 2 = ?",
    "marks": 2,
    "options": [
      { "label": "A", "text": "3" },
      { "label": "B", "text": "4" },
      { "label": "C", "text": "5" },
      { "label": "D", "text": "6" }
    ]
  }]
}`}</pre>
                        <pre className="text-xs bg-gray-50 rounded-xl p-3 overflow-auto border border-gray-100">{`// answers.json
{
  "testTitle": "Math Quiz",
  "answers": [{
    "questionId": "Q1",
    "correctAnswer": "B",
    "reason": "2 + 2 is always 4."
  }]
}`}</pre>
                    </div>
                </details>
            </div>

            {/* Test List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">All Tests ({tests.length})</h2>
                    {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />}
                </div>

                {!loading && tests.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
                        <p className="text-3xl mb-2">📭</p>
                        <p>No tests yet. Upload your first test above.</p>
                    </div>
                )}

                {tests.map(test => (
                    <div key={test._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header Row */}
                        <div className="p-5">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h3 className="font-bold text-gray-900 truncate">{test.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {test.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${test.resultMode === 'instant' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {test.resultMode === 'instant' ? '⚡ Instant' : '⏳ Manual'}
                                        </span>
                                        {test.resultMode === 'manual' && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${test.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                {test.isPublished ? '✅ Published' : '🔒 Unpublished'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                                        <span>📚 {test.subject?.name || 'N/A'}</span>
                                        <span>🏫 {test.batch?.name || 'N/A'}</span>
                                        <span>⏱ {test.durationMinutes} min</span>
                                        <span>📊 {test.totalMarks} marks</span>
                                        <span>❓ {test.questionCount} Qs</span>
                                        {test.negativeMarking > 0 && <span className="text-red-500">−{test.negativeMarking} neg marking</span>}
                                        <span><Users className="inline w-3 h-3 mr-0.5" />{test.attemptCount} attempts</span>
                                    </div>
                                </div>
                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {test.resultMode === 'manual' && !test.isPublished && (
                                        <button
                                            onClick={() => publishResults(test._id)}
                                            disabled={publishing === test._id}
                                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold disabled:opacity-60 transition-colors"
                                        >
                                            {publishing === test._id ? '…' : 'Publish'}
                                        </button>
                                    )}
                                    <button onClick={() => toggleActive(test._id, test.isActive)} title={test.isActive ? 'Deactivate' : 'Activate'} className="text-gray-400 hover:text-blue-600 transition-colors">
                                        {test.isActive ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
                                    </button>
                                    <button onClick={() => deleteTest(test._id, test.title)} title="Delete" className="text-gray-400 hover:text-red-600 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => loadAttempts(test._id)} title="View Attempts" className="text-gray-400 hover:text-blue-600 transition-colors">
                                        {expandedId === test._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Attempts Drawer */}
                        {expandedId === test._id && (
                            <div className="border-t border-gray-100 bg-gray-50">
                                {loadingAttempts === test._id ? (
                                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>
                                ) : (attempts[test._id] ?? []).length === 0 ? (
                                    <div className="text-center py-8 text-gray-400 text-sm">No attempts yet.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
                                                    <th className="px-4 py-3 text-left font-semibold">#</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Student</th>
                                                    <th className="px-4 py-3 text-left font-semibold">Roll</th>
                                                    <th className="px-4 py-3 text-right font-semibold">Marks</th>
                                                    <th className="px-4 py-3 text-right font-semibold">%</th>
                                                    <th className="px-4 py-3 text-center font-semibold"><CheckCircle className="inline w-3.5 h-3.5 text-green-500" /></th>
                                                    <th className="px-4 py-3 text-center font-semibold"><XCircle className="inline w-3.5 h-3.5 text-red-500" /></th>
                                                    <th className="px-4 py-3 text-center font-semibold"><Clock className="inline w-3.5 h-3.5 text-gray-400" /></th>
                                                    <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(attempts[test._id] ?? []).map((att, idx) => (
                                                    <tr key={att._id} className="border-b border-gray-100 hover:bg-white transition-colors">
                                                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{att.studentId?.fullName}</td>
                                                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{att.studentId?.rollNumber}</td>
                                                        <td className="px-4 py-3 text-right font-bold text-gray-900">{att.marksObtained}/{att.totalMarks}</td>
                                                        <td className={`px-4 py-3 text-right font-bold ${att.percentage >= 60 ? 'text-green-600' : 'text-red-500'}`}>{att.percentage}%</td>
                                                        <td className="px-4 py-3 text-center text-green-600 font-semibold">{att.correctCount}</td>
                                                        <td className="px-4 py-3 text-center text-red-500 font-semibold">{att.wrongCount}</td>
                                                        <td className="px-4 py-3 text-center text-gray-400 font-semibold">{att.skippedCount}</td>
                                                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(att.submittedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
