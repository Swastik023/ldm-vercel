'use client';

import { useState, useEffect } from 'react';
import { createAssignment, deleteAssignment, updateAssignment } from '@/actions/academic';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { toast } from 'react-hot-toast';
import { Check, X, Search, Filter } from 'lucide-react';

export default function AssignmentManager({
    initialAssignments,
    sessions,
    programs,
    batches,
    teachers,
    subjects
}: any) {
    const [assignments, setAssignments] = useState<any[]>(initialAssignments);
    const [filters, setFilters] = useState({
        session: sessions.find((s: any) => s.is_active)?._id || sessions[0]?._id || '',
        program: programs[0]?._id || '',
        semester: 1,
        batch: ''
    });

    // Helper to filter assignments locally or refetch
    // For now we assume initialAssignments are fetched based on initial filters server side?
    // Actually the page might pass All assignments or we might want to fetch client side like legacy?
    // Let's implement client-side fetch for filtering to be robust.

    // Changing filters should probably reload data.
    // We can use a load function.

    const [loading, setLoading] = useState(false);

    // Filter available subjects based on selection
    const availableSubjects = subjects.filter((sub: any) =>
        (filters.program ? sub.program._id === filters.program : true) &&
        (filters.semester ? sub.semester === Number(filters.semester) : true)
    );

    // Store pending changes map: { subjectId: { teacherId, section } }
    // Legacy app used rowKey (subject code + section?).
    // Here we can iterate available subjects and check if assignment exists.

    // We need to display a row PER Subject.
    // If assignment exists, show current teacher. If not, show "Assign".

    const getAssignmentForSubject = (subjectId: string, section: string = 'A') => {
        return assignments.find((a: any) =>
            a.subject._id === subjectId &&
            a.section === section &&
            a.session?._id === filters.session &&
            (filters.batch ? a.batch?._id === filters.batch : true)
        );
    };

    const handleAssign = async (subjectId: string, teacherId: string, section: string) => {
        if (!teacherId || !filters.session) return;
        setLoading(true);
        try {
            const result = await createAssignment({
                subject: subjectId,
                teacher: teacherId,
                session: filters.session,
                section: section,
                batch: filters.batch || undefined // Optional batch
            });

            if (result.success) {
                toast.success('Assigned successfully');
                setAssignments([...assignments, result.data]);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to assign');
        } finally {
            setLoading(false);
        }
    };

    const handleUnassign = async (assignmentId: string) => {
        if (!confirm("Remove assignment?")) return;
        setLoading(true);
        try {
            const result = await deleteAssignment(assignmentId);
            if (result.success) {
                toast.success('Removed assignment');
                setAssignments(assignments.filter(a => a._id !== assignmentId));
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error('Failed to remove');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border space-y-4 md:space-y-0 md:flex gap-4">
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Session</label>
                    <select
                        className="w-full mt-1 p-2 border rounded"
                        value={filters.session}
                        onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                    >
                        {sessions.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Program</label>
                    <select
                        className="w-full mt-1 p-2 border rounded"
                        value={filters.program}
                        onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                    >
                        {programs.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Semester</label>
                    <select
                        className="w-full mt-1 p-2 border rounded"
                        value={filters.semester}
                        onChange={(e) => setFilters({ ...filters, semester: Number(e.target.value) })}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Batch</label>
                    <select
                        className="w-full mt-1 p-2 border rounded"
                        value={filters.batch}
                        onChange={(e) => setFilters({ ...filters, batch: e.target.value })}
                    >
                        <option value="">No Batch (General)</option>
                        {batches
                            .filter((b: any) => b.program._id === filters.program && b.session._id === filters.session)
                            .map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Subject</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Code</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Section</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Teacher</th>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {availableSubjects.map((sub: any) => {
                                // For simplicity, let's assume 'A' section or we can have section selection?
                                // Legacy code had pendingSections state.
                                // Let's simplify: Show 'Section A' row by default? Or allow adding sections.
                                // The legacy app had fixed section selection in the row.
                                const currentAssignment = getAssignmentForSubject(sub._id, 'A');

                                return (
                                    <tr key={sub._id}>
                                        <td className="px-4 py-3 font-medium">{sub.name}</td>
                                        <td className="px-4 py-3">{sub.code}</td>
                                        <td className="px-4 py-3">
                                            <div className="w-16 text-center font-bold bg-gray-100 rounded px-2 py-1">A</div>
                                            {/* Ideally section should be dynamic */}
                                        </td>
                                        <td className="px-4 py-3">
                                            {currentAssignment ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-blue-600">
                                                        {currentAssignment.teacher.fullName}
                                                    </span>
                                                </div>
                                            ) : (
                                                <select
                                                    className="w-full max-w-xs border rounded p-1"
                                                    onChange={(e) => {
                                                        if (e.target.value) handleAssign(sub._id, e.target.value, 'A');
                                                    }}
                                                    value=""
                                                    disabled={loading}
                                                >
                                                    <option value="">Select Teacher...</option>
                                                    {teachers.map((t: any) => (
                                                        <option key={t._id} value={t._id}>{t.fullName}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            {currentAssignment && (
                                                <button
                                                    onClick={() => handleUnassign(currentAssignment._id)}
                                                    className="text-red-500 hover:text-red-700 p-1"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {availableSubjects.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                        No subjects found for selection.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
