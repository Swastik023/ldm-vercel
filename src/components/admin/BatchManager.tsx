'use client';

import { useState } from 'react';
import { createBatch, deleteBatch } from '@/actions/academic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Trash2, Users, Plus } from 'lucide-react';

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
    session: Session;
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
    const [name, setName] = useState('');
    const [programId, setProgramId] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [capacity, setCapacity] = useState(60);
    const [isLoading, setIsLoading] = useState(false);

    // Filter states
    const [filterProgram, setFilterProgram] = useState('');
    const [filterSession, setFilterSession] = useState('');

    const filteredBatches = batches.filter(batch => {
        if (filterProgram && batch.program?._id !== filterProgram) return false;
        if (filterSession && batch.session?._id !== filterSession) return false;
        return true;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createBatch({
                name,
                program: programId,
                session: sessionId,
                capacity
            });

            if (result.success) {
                toast.success('Batch created');
                // The returned batch might not have populated fields, usually we'd re-fetch or manual construct
                // For simplicity, we might need to manually populate or refresh page.
                // Or better, let's just refresh the page data via router.refresh() if needed, but here simple state update:
                // We need the program/session objects for display
                const prog = programs.find(p => p._id === programId);
                const sess = sessions.find(s => s._id === sessionId);

                if (prog && sess) {
                    const newBatch = {
                        ...result.data,
                        program: prog,
                        session: sess
                    };
                    setBatches([newBatch, ...batches]);
                }

                setName('');
            } else {
                toast.error(result.error || 'Failed to create batch');
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

    return (
        <div className="space-y-6">
            {/* Create Batch Card */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium">Batch Name</label>
                            <Input
                                placeholder="e.g. Section A"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-sm font-medium">Program</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-lg">{batch.name}</h3>
                                    <p className="text-sm text-gray-500">{batch.program?.code} • {batch.session?.name}</p>
                                </div>
                                <button onClick={() => handleDelete(batch._id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 mt-4">
                                <Users className="h-4 w-4" />
                                <span className="text-sm">{batch.current_students} / {batch.capacity} Students</span>
                            </div>
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
