'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Bell, FileText } from 'lucide-react';

interface DashboardData {
    profile: {
        id: string;
        name: string;
        email: string;
        jobTitle: string | null;
    };
    notifications: Array<{
        id: string;
        message: string;
        created_at: string;
    }>;
    notices: Array<{
        id: number;
        title: string;
        category: string;
        priority: string;
        created_at: string;
    }>;
}

const mockEmployeeData: DashboardData = {
    profile: {
        id: '1',
        name: 'Staff Member',
        email: 'staff@example.com',
        jobTitle: 'Administrative Officer'
    },
    notifications: [
        { id: '1', message: 'Meeting at 3 PM', created_at: new Date().toISOString() }
    ],
    notices: [
        { id: 1, title: 'Holiday Announcement', category: 'General', priority: 'High', created_at: new Date().toISOString() }
    ]
};

const EmployeeDashboard: React.FC = () => {
    const { data: session } = useSession();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API
        setTimeout(() => {
            if (session?.user) {
                mockEmployeeData.profile.name = session.user.name || mockEmployeeData.profile.name;
            }
            setDashboardData(mockEmployeeData);
            setLoading(false);
        }, 1000);
    }, [session]);

    if (loading) return <div className="h-[50vh] flex items-center justify-center"><LoadingSpinner size={40} /></div>;

    const getPriorityColor = (priority: string) => {
        switch (priority?.toLowerCase()) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-amber-100 text-amber-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 rounded-2xl shadow-xl text-white">
                <h1 className="text-3xl font-bold mb-2">
                    Welcome, {dashboardData?.profile.name}!
                </h1>
                <p className="text-teal-100 opacity-90">
                    {dashboardData?.profile.jobTitle || 'Staff Portal'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notifications */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-teal-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Notifications</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardData?.notifications.length || 0}
                            </p>
                        </div>
                        <div className="bg-teal-100 p-3 rounded-full text-teal-600">
                            <Bell size={24} />
                        </div>
                    </div>
                </div>

                {/* Notices */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-cyan-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase">Active Notices</h3>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {dashboardData?.notices.length || 0}
                            </p>
                        </div>
                        <div className="bg-cyan-100 p-3 rounded-full text-cyan-600">
                            <FileText size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Notices List */}
            {dashboardData?.notices && dashboardData.notices.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText size={20} className="text-cyan-600" />
                        Latest Notices
                    </h2>
                    <div className="space-y-3">
                        {dashboardData.notices.map((notice) => (
                            <div key={notice.id} className="p-4 bg-gray-50 rounded-lg flex items-start justify-between hover:bg-gray-100 transition">
                                <div>
                                    <h4 className="font-semibold text-gray-900">{notice.title}</h4>
                                    <p className="text-sm text-gray-500">{notice.category}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(notice.priority)}`}>
                                    {notice.priority}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
