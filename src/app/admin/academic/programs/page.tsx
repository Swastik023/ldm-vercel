'use client';

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { Book, Layers, Plus, Trash2, Edit } from 'lucide-react';

interface Program {
    program_id: number;
    program_code: string;
    program_name: string;
    total_credits: number;
    student_count: number;
}

const mockPrograms: Program[] = [
    { program_id: 1, program_code: 'DPH', program_name: 'Diploma in Pharmacy', total_credits: 120, student_count: 85 },
    { program_id: 2, program_code: 'BPH', program_name: 'Bachelor of Pharmacy', total_credits: 160, student_count: 120 },
];

const ProgramsCurriculum: React.FC = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

    useEffect(() => {
        setTimeout(() => {
            setPrograms(mockPrograms);
            if (mockPrograms.length > 0) setSelectedProgram(mockPrograms[0]);
            setLoading(false);
        }, 800);
    }, []);

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><LoadingSpinner size={40} /></div>;

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* Sidebar List */}
            <div className="w-full md:w-80 bg-white rounded-xl shadow-md border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <Layers size={20} className="text-amber-600" />
                        Programs
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {programs.map(prog => (
                        <button
                            key={prog.program_id}
                            onClick={() => setSelectedProgram(prog)}
                            className={`w-full text-left p-3 rounded-lg transition-all ${selectedProgram?.program_id === prog.program_id
                                    ? 'bg-amber-50 text-amber-700 border-l-4 border-amber-600'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                        >
                            <div className="font-bold text-sm">{prog.program_code}</div>
                            <div className="text-xs text-gray-500 truncate">{prog.program_name}</div>
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-100">
                    <button className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2 text-sm font-medium">
                        <Plus size={16} /> Add Program
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-white rounded-xl shadow-md border border-gray-100 p-6 overflow-y-auto">
                {selectedProgram ? (
                    <div className="space-y-8">
                        <div>
                            <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold uppercase mb-2">
                                Active Program
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900">{selectedProgram.program_name}</h1>
                            <p className="text-gray-500 text-lg">{selectedProgram.program_code}</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase font-bold">Total Credits</div>
                                <div className="text-xl font-bold text-gray-900">{selectedProgram.total_credits}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase font-bold">Students</div>
                                <div className="text-xl font-bold text-gray-900">{selectedProgram.student_count}</div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Book size={20} className="text-amber-600" />
                                    Curriculum
                                </h3>
                                <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                                    + Add Subject
                                </button>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3">Code</th>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Credits</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {[1, 2, 3].map((i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-mono text-gray-600">SUB-10{i}</td>
                                                <td className="px-4 py-3 font-medium text-gray-800">Mock Subject {i}</td>
                                                <td className="px-4 py-3 text-gray-600">3</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button className="text-gray-400 hover:text-amber-600 p-1"><Edit size={16} /></button>
                                                    <button className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Layers size={48} className="mb-4 opacity-50" />
                        <p>Select a program to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgramsCurriculum;
