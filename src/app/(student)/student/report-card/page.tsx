'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Download, AlertCircle, GraduationCap } from 'lucide-react';

// Report card data is managed server-side and published by admin.
// Until results are published this page shows an appropriate empty state.
// If a /api/student/report-card endpoint is added later, swap the fetch here.

export default function StudentReportCard() {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(true);

    // Simulate checking if report card is available
    // Replace this fetch with a real API call when report card data is stored in DB
    useEffect(() => {
        // No report card model exists yet — show empty state immediately
        setLoading(false);
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
    );

    // EMPTY STATE — no fake/random data
    return (
        <div className="max-w-2xl mx-auto space-y-4 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Report Card</h1>

            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <GraduationCap size={36} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">No Results Published Yet</h2>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Your report card will appear here once your institution publishes examination results for the current semester.
                </p>
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 text-left max-w-sm mx-auto">
                    <p className="font-semibold mb-1">Student: {session?.user?.name || '—'}</p>
                    <p className="text-blue-600">Contact the admin office for result enquiries.</p>
                </div>
            </div>
        </div>
    );
}
