'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Download, AlertCircle, GraduationCap } from 'lucide-react';

interface ExamResult {
    subject: string;
    code: string;
    teacher: string;
    exam_type: string;
    max_marks: number;
    marks_obtained: number;
    remarks: string;
}

interface SemesterReport {
    semester: number;
    results: ExamResult[];
}

export default function StudentReportCard() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);
    const [reports, setReports] = useState<SemesterReport[]>([]);

    useEffect(() => {
        fetch('/api/student/report-card')
            .then(res => res.json())
            .then(d => {
                if (d.success) setReports(d.report || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
    );

    if (reports.length === 0) {
        return (
            <div className="max-w-4xl mx-auto space-y-4 py-4">
                <h1 className="text-2xl font-bold text-gray-900">Report Card</h1>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <GraduationCap size={36} className="text-blue-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">No Results Published Yet</h2>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Your report card will appear here once your institution publishes examination results for the current semester.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">My Report Cards</h1>

            {reports.map((report) => (
                <div key={report.semester} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800">Semester {report.semester}</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">Subject</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">Type</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">Marks</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">Percentage</th>
                                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">Instructor Feedback</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {report.results.map((res, idx) => {
                                    const percentage = res.max_marks > 0 ? ((res.marks_obtained / res.max_marks) * 100).toFixed(1) : '0.0';
                                    let textColor = 'text-green-600';
                                    if (Number(percentage) < 40) textColor = 'text-red-600';

                                    return (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-gray-900">{res.subject}</p>
                                                <p className="text-xs text-gray-500">{res.code} · {res.teacher}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 capitalize">{res.exam_type}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-gray-800">
                                                {res.marks_obtained} <span className="text-gray-400 font-normal">/ {res.max_marks}</span>
                                            </td>
                                            <td className={`px-6 py-4 text-sm font-bold ${textColor}`}>
                                                {percentage}%
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 italic">
                                                {res.remarks || '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                {(() => {
                                    const validResults = report.results.filter(r => r.max_marks > 0);
                                    const avgPct = validResults.length
                                        ? validResults.reduce((sum, r) => sum + (r.marks_obtained / r.max_marks) * 100, 0) / validResults.length
                                        : 0;
                                    const passed = validResults.every(r => (r.marks_obtained / r.max_marks) * 100 >= 40);
                                    return (
                                        <tr>
                                            <td className="px-6 py-3 font-bold text-gray-700 text-sm" colSpan={2}>Semester Summary</td>
                                            <td className="px-6 py-3 text-sm text-gray-500">{validResults.length} subject{validResults.length !== 1 ? 's' : ''}</td>
                                            <td className="px-6 py-3 font-black text-sm">
                                                <span className={avgPct >= 40 ? 'text-green-600' : 'text-red-600'}>{avgPct.toFixed(1)}% avg</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {passed ? '✓ PASS' : '✗ FAIL'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })()}
                            </tfoot>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
