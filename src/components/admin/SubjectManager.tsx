'use client';

import { useState } from 'react';
import { createSubject, deleteSubject } from '@/actions/academic';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Book, Plus, Trash2 } from 'lucide-react';

interface Program {
    _id: string;
    name: string;
    code: string;
    total_semesters: number;
}

interface Subject {
    _id: string;
    name: string;
    code: string;
    credits: number;
    program: Program;
    semester: number;
    type: string;
}

export default function SubjectManager({
    initialSubjects,
    programs
}: {
    initialSubjects: Subject[],
    programs: Program[]
}) {
    const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Form
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [credits, setCredits] = useState(3);
    const [programId, setProgramId] = useState('');
    const [semester, setSemester] = useState(1);
    const [type, setType] = useState('theory');

    // Filter
    const [filterProgram, setFilterProgram] = useState('');
    const [filterSemester, setFilterSemester] = useState('');

    const filteredSubjects = subjects.filter(sub => {
        if (filterProgram && sub.program?._id !== filterProgram) return false;
        if (filterSemester && sub.semester !== Number(filterSemester)) return false;
        return true;
    });

    const getSemesterOptions = (progId: string) => {
        const prog = programs.find(p => p._id === progId);
        if (!prog) return [];
        return Array.from({ length: prog.total_semesters }, (_, i) => i + 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createSubject({ name, code, credits, program: programId, semester, type });
            if (result.success) {
                toast.success('Subject created');
                const prog = programs.find(p => p._id === programId);
                if (prog) setSubjects([{ ...result.data, program: prog }, ...subjects]);
                setName(''); setCode('');
            } else {
                toast.error(result.error || 'Failed to create subject');
            }
        } catch { toast.error('An error occurred'); }
        finally { setIsLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this subject? This cannot be undone.')) return;
        setDeletingId(id);
        try {
            const result = await deleteSubject(id);
            if (result.success) {
                toast.success('Subject deleted');
                setSubjects(prev => prev.filter(s => s._id !== id));
            } else {
                toast.error((result as any).error || 'Failed to delete');
            }
        } catch { toast.error('An error occurred'); }
        finally { setDeletingId(null); }
    };

    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Plus className="h-5 w-5" /> Add Subject
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input placeholder="Subject Name" value={name} onChange={(e) => setName(e.target.value)} required />
                            <Input placeholder="Subject Code" value={code} onChange={(e) => setCode(e.target.value)} required />
                            <div>
                                <label className="text-sm font-medium">Program</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={programId}
                                    onChange={(e) => { setProgramId(e.target.value); setSemester(1); }}
                                    required
                                >
                                    <option value="">Select Program</option>
                                    {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Semester</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={semester}
                                        onChange={(e) => setSemester(Number(e.target.value))}
                                        required disabled={!programId}
                                    >
                                        {getSemesterOptions(programId).map(s => <option key={s} value={s}>Sem {s}</option>)}
                                        {!programId && <option value="1">Sem 1</option>}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Credits</label>
                                    <Input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Type</label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={type} onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="theory">Theory</option>
                                    <option value="practical">Practical</option>
                                    <option value="elective">Elective</option>
                                </select>
                            </div>
                            <Button type="submit" isLoading={isLoading} className="w-full">Create Subject</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
                {/* Filters */}
                <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border">
                    <div className="flex-1">
                        <select className="w-full text-sm border-gray-300 rounded-md" value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                            <option value="">All Programs</option>
                            {programs.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1">
                        <select className="w-full text-sm border-gray-300 rounded-md" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                            <option value="">All Semesters</option>
                            {Array.from({ length: 8 }, (_, i) => i + 1).map(s => <option key={s} value={s}>Sem {s}</option>)}
                        </select>
                    </div>
                </div>

                <p className="text-sm text-gray-500">{filteredSubjects.length} subject{filteredSubjects.length !== 1 ? 's' : ''} found</p>

                <div className="grid gap-3 md:grid-cols-2">
                    {filteredSubjects.map((sub) => (
                        <Card key={sub._id} className="bg-gray-50">
                            <CardContent className="p-4 flex gap-3 items-start">
                                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0 mt-0.5">
                                    <Book className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate">{sub.name}</h4>
                                    <div className="text-xs text-gray-500 space-y-0.5 mt-0.5">
                                        <p>{sub.code} • {sub.credits} Credits • {sub.type}</p>
                                        <span className="bg-gray-200 inline-block px-2 py-0.5 rounded text-xs">
                                            {sub.program?.code} – Sem {sub.semester}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(sub._id)}
                                    disabled={deletingId === sub._id}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40 shrink-0"
                                    title="Delete subject"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </CardContent>
                        </Card>
                    ))}
                    {filteredSubjects.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-400">No subjects found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
