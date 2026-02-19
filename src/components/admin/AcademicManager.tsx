'use client';

import { useState } from 'react';
import { createProgram, createSession, deleteProgram, deleteSession } from '@/actions/academic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Calendar, BookOpen, Plus, Trash2 } from 'lucide-react';

interface Program {
    _id: string;
    name: string;
    code: string;
    duration_years: number;
    total_semesters: number;
}

interface Session {
    _id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export default function AcademicManager({
    initialPrograms,
    initialSessions
}: {
    initialPrograms: Program[],
    initialSessions: Session[]
}) {
    const [activeTab, setActiveTab] = useState<'programs' | 'sessions'>('programs');
    const [programs, setPrograms] = useState<Program[]>(initialPrograms);
    const [sessions, setSessions] = useState<Session[]>(initialSessions);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Program Form
    const [progName, setProgName] = useState('');
    const [progCode, setProgCode] = useState('');
    const [duration, setDuration] = useState(3);
    const [semesters, setSemesters] = useState(6);

    // Session Form
    const [sessName, setSessName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handleProgramSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createProgram({ name: progName, code: progCode, duration_years: duration, total_semesters: semesters });
            if (result.success) {
                toast.success('Program created');
                setPrograms([result.data, ...programs]);
                setProgName(''); setProgCode('');
            } else {
                toast.error(result.error || 'Failed to create program');
            }
        } catch { toast.error('An error occurred'); }
        finally { setIsLoading(false); }
    };

    const handleSessionSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createSession({ name: sessName, start_date: startDate, end_date: endDate });
            if (result.success) {
                toast.success('Session created');
                setSessions([result.data, ...sessions]);
                setSessName(''); setStartDate(''); setEndDate('');
            } else {
                toast.error(result.error || 'Failed to create session');
            }
        } catch { toast.error('An error occurred'); }
        finally { setIsLoading(false); }
    };

    const handleDeleteProgram = async (id: string) => {
        if (!confirm('Delete this program? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            const result = await deleteProgram(id);
            if (result.success) {
                toast.success('Program deleted');
                setPrograms(prev => prev.filter(p => p._id !== id));
            } else {
                toast.error((result as any).error || 'Failed to delete');
            }
        } catch { toast.error('An error occurred'); }
        finally { setDeletingId(null); }
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm('Delete this session? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            const result = await deleteSession(id);
            if (result.success) {
                toast.success('Session deleted');
                setSessions(prev => prev.filter(s => s._id !== id));
            } else {
                toast.error((result as any).error || 'Failed to delete');
            }
        } catch { toast.error('An error occurred'); }
        finally { setDeletingId(null); }
    };

    return (
        <div className="space-y-6">
            <div className="flex space-x-4 border-b pb-2">
                <button onClick={() => setActiveTab('programs')}
                    className={`px-4 py-2 font-medium ${activeTab === 'programs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Programs
                </button>
                <button onClick={() => setActiveTab('sessions')}
                    className={`px-4 py-2 font-medium ${activeTab === 'sessions' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>
                    Academic Sessions
                </button>
            </div>

            {activeTab === 'programs' && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Plus className="h-5 w-5" /> Add Program
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleProgramSubmit} className="space-y-4">
                                <Input placeholder="Program Name (e.g. B.Tech CS)" value={progName} onChange={(e) => setProgName(e.target.value)} required />
                                <Input placeholder="Program Code (e.g. BTCSE)" value={progCode} onChange={(e) => setProgCode(e.target.value)} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Duration (Years)</label>
                                        <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Semesters</label>
                                        <Input type="number" value={semesters} onChange={(e) => setSemesters(Number(e.target.value))} required />
                                    </div>
                                </div>
                                <Button type="submit" isLoading={isLoading} className="w-full">Create Program</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Existing Programs ({programs.length})</h3>
                        {programs.length === 0 && <p className="text-gray-400 text-sm py-4">No programs created yet.</p>}
                        {programs.map((prog) => (
                            <Card key={prog._id} className="bg-gray-50">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold">{prog.name} <span className="font-mono text-xs text-gray-500">({prog.code})</span></h4>
                                        <p className="text-sm text-gray-500">{prog.duration_years} Years • {prog.total_semesters} Semesters</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="text-gray-300 h-5 w-5" />
                                        <button
                                            onClick={() => handleDeleteProgram(prog._id)}
                                            disabled={deletingId === prog._id}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                                            title="Delete program"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'sessions' && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Plus className="h-5 w-5" /> Add Session
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSessionSubmit} className="space-y-4">
                                <Input placeholder="Session Name (e.g. 2024-2025)" value={sessName} onChange={(e) => setSessName(e.target.value)} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Start Date</label>
                                        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">End Date</label>
                                        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
                                    </div>
                                </div>
                                <Button type="submit" isLoading={isLoading} className="w-full">Create Session</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold">Existing Sessions ({sessions.length})</h3>
                        {sessions.length === 0 && <p className="text-gray-400 text-sm py-4">No sessions created yet.</p>}
                        {sessions.map((sess) => (
                            <Card key={sess._id} className="bg-gray-50">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold flex items-center gap-2">
                                            {sess.name}
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sess.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                {sess.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {new Date(sess.start_date).toLocaleDateString()} – {new Date(sess.end_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="text-gray-300 h-5 w-5" />
                                        <button
                                            onClick={() => handleDeleteSession(sess._id)}
                                            disabled={deletingId === sess._id}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                                            title="Delete session"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
