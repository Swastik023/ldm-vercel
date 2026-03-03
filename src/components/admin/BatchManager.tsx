'use client';

import { useState } from 'react';
import { createBatch, deleteBatch, updateBatch, populateBatches } from '@/actions/academic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Trash2, Users, Plus, Edit2, X, CheckSquare } from 'lucide-react';

interface Program {
    _id: string;
    name: string;
    code: string;
}

interface Session {
    _id: string;
    name: string;
}

interface Batch {
    _id: string;
    name: string;
    program: Program;
    session?: Session;
    intakeMonth: 'January' | 'July';
    joiningYear: number;
    courseDurationYears: number;
    startDate: string;
    expectedEndDate: string;
    status: 'upcoming' | 'active' | 'completed';
    capacity: number;
    current_students: number;
}

export default function BatchManager({
    initialBatches,
    programs,
    sessions
}: {
    initialBatches: Batch[],
    programs: Program[],
    sessions: Session[]
}) {
    const [batches, setBatches] = useState<Batch[]>(initialBatches);
    const [intakeMonth, setIntakeMonth] = useState('January');
    const [joiningYear, setJoiningYear] = useState(new Date().getFullYear().toString());
    const [programId, setProgramId] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [capacity, setCapacity] = useState(60);
    const [isLoading, setIsLoading] = useState(false);
    const [isPopulating, setIsPopulating] = useState(false);

    // Edit states
    const [editBatchId, setEditBatchId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ name: string; programId: string; sessionId: string }>({ name: '', programId: '', sessionId: '' });
    const [editLoading, setEditLoading] = useState(false);

    // Filter states
    const [filterProgram, setFilterProgram] = useState('');
    const [filterSession, setFilterSession] = useState('');

    const filteredBatches = batches.filter(batch => {
        if (filterProgram && batch.program?._id !== filterProgram) return false;
        if (filterSession && batch.session?._id !== filterSession) return false;
        return true;
    });

    const computedName = (() => {
        if (!programId || !joiningYear) return '';
        const prog = programs.find((p) => p._id === programId);
        if (!prog) return '';
        const monthCode = intakeMonth === 'January' ? 'JAN' : 'JUL';
        return `${prog.code.toUpperCase()}_${joiningYear}_${monthCode}`;
    })();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!computedName) {
            toast.error("Please select a program and joining year");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/batches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programId,
                    joiningYear: parseInt(joiningYear, 10),
                    intakeMonth,
                    capacity,
                }),
            });
            const result = await res.json();

            if (result.success) {
                toast.success(`Batch "${result.batch?.name}" created`);
                // Reload to show fresh data with all populated fields
                window.location.reload();
            } else {
                toast.error(result.message || 'Failed to create batch');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            const result = await deleteBatch(id);
            if (result.success) {
                toast.success('Batch deleted');
                setBatches(batches.filter(b => b._id !== id));
            } else {
                toast.error('Failed to delete batch');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const handleEditSave = async (id: string) => {
        setEditLoading(true);
        try {
            const result = await updateBatch(id, {
                name: editForm.name,
                program: editForm.programId,
                session: editForm.sessionId
            });

            if (result.success) {
                toast.success('Batch updated');
                const prog = programs.find(p => p._id === editForm.programId);
                const sess = sessions.find(s => s._id === editForm.sessionId);
                if (prog && sess) {
                    setBatches(batches.map(b => b._id === id ? { ...b, name: editForm.name, program: prog, session: sess } : b));
                }
                setEditBatchId(null);
            } else {
                toast.error(result.error || 'Failed to update batch');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setEditLoading(false);
        }
    };
    const handlePopulate = async () => {
        if (!confirm('This will auto-generate batches for the current year + next 2 years for all active programs. Safe to run multiple times. Proceed?')) return;
        setIsPopulating(true);
        try {
            const res = await fetch('/api/admin/batches/seed', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                toast.success(result.message || 'Batches seeded successfully');
                window.location.reload();
            } else {
                toast.error(result.message || result.error || 'Failed to seed batches');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsPopulating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Batch Management</h2>
                <Button onClick={handlePopulate} disabled={isPopulating} variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                    {isPopulating ? 'Populating...' : 'Initialize/Sync Batches (2020-2040)'}
                </Button>
            </div>
            {/* Create Batch Card */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5 items-end">
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium">Intake Month</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1"
                                value={intakeMonth}
                                onChange={(e) => setIntakeMonth(e.target.value)}
                                required
                            >
                                <option value="January">January</option>
                                <option value="July">July</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium">Joining Year</label>
                            <Input
                                type="number"
                                className="mt-1"
                                placeholder="YYYY"
                                value={joiningYear}
                                onChange={(e) => setJoiningYear(e.target.value)}
                                min={2000}
                                max={2100}
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium">Program</label>
                            <select
                                className="flex h-10 w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={programId}
                                onChange={(e) => setProgramId(e.target.value)}
                                required
                            >
                                <option value="">Select Program</option>
                                {programs.map(p => (
                                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium">Session</label>
                            <select
                                className="flex h-10 w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={sessionId}
                                onChange={(e) => setSessionId(e.target.value)}
                                required
                            >
                                <option value="">Select Session</option>
                                {sessions.map(s => (
                                    <option key={s._id} value={s._id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <Button type="submit" isLoading={isLoading} className="w-full">
                                <Plus className="mr-2 h-4 w-4" /> Create
                            </Button>
                        </div>
                        <div className="md:col-span-1 md:col-start-1 md:col-end-6">
                            <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                                <span className="font-semibold text-gray-700">Generated Batch Name:</span>{' '}
                                {computedName ? (
                                    <span className="font-mono text-blue-600 font-bold ml-1">{computedName}</span>
                                ) : (
                                    <span className="italic ml-1">Select year and program</span>
                                )}
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm">
                <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Filter Program</label>
                    <select
                        className="w-full mt-1 p-2 border rounded"
                        value={filterProgram}
                        onChange={(e) => setFilterProgram(e.target.value)}
                    >
                        <option value="">All Programs</option>
                        {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Filter Session</label>
                    <select
                        className="w-full mt-1 p-2 border rounded"
                        value={filterSession}
                        onChange={(e) => setFilterSession(e.target.value)}
                    >
                        <option value="">All Sessions</option>
                        {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredBatches.map((batch) => (
                    <Card key={batch._id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-5">
                            {editBatchId === batch._id ? (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-gray-700">Edit Batch</h3>
                                    <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Batch Name" />
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editForm.programId} onChange={e => setEditForm({ ...editForm, programId: e.target.value })}>
                                        <option value="">Select Program</option>
                                        {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                    </select>
                                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editForm.sessionId} onChange={e => setEditForm({ ...editForm, sessionId: e.target.value })}>
                                        <option value="">Select Session</option>
                                        {sessions.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleEditSave(batch._id)} disabled={editLoading || !editForm.name || !editForm.programId || !editForm.sessionId} className="flex-1 bg-blue-600 hover:bg-blue-700">{editLoading ? 'Saving...' : 'Save'}</Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditBatchId(null)} className="flex-1">Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg flex items-center gap-2">
                                                {batch.name}
                                                <span className={`px-2 py-0.5 rounded text-xs text-white ${batch.status === 'active' ? 'bg-green-500' : batch.status === 'completed' ? 'bg-gray-400' : 'bg-blue-500'}`}>
                                                    {batch.status.toUpperCase()}
                                                </span>
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {batch.program?.name} • {batch.intakeMonth === 'January' ? '❄️ Jan' : '☀️ Jul'} {batch.joiningYear}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 text-gray-400">
                                            <button onClick={() => { setEditBatchId(batch._id); setEditForm({ name: batch.name, programId: batch.program._id, sessionId: batch.session?._id || '' }); }} className="hover:text-blue-600 transition-colors">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(batch._id)} className="hover:text-red-600 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500 space-y-1">
                                        <p><strong>Start:</strong> {new Date(batch.startDate).toLocaleDateString()}</p>
                                        <p><strong>Est. Graduation:</strong> {new Date(batch.expectedEndDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 mt-4 pt-3 border-t">
                                        <Users className="h-4 w-4" />
                                        <span className="text-sm">{batch.current_students} / {batch.capacity} Students</span>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {filteredBatches.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No batches found.
                    </div>
                )}
            </div>
        </div>
    );
}
