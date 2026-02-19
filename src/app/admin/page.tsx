export const dynamic = 'force-dynamic';

import Link from 'next/link';
import {
    Bell,
    Image,
    MessageSquare,
    Users,
    Settings,
    BookOpen,
    GraduationCap,
    Briefcase,
    UserCheck,
    Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import Notice from '@/models/Notice';
import Contact from '@/models/Contact';

async function getDashboardStats() {
    try {
        await dbConnect();
        const [totalUsers, students, teachers, employees, activeNotices, unreadMessages] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'teacher' }),
            User.countDocuments({ role: 'employee' }),
            Notice.countDocuments({ isActive: true }),
            Contact.countDocuments({ status: 'unread' }),
        ]);
        return { totalUsers, students, teachers, employees, activeNotices, unreadMessages };
    } catch {
        return { totalUsers: 0, students: 0, teachers: 0, employees: 0, activeNotices: 0, unreadMessages: 0 };
    }
}

export default async function AdminDashboard() {
    const stats = await getDashboardStats();

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            sub: `${stats.students} students · ${stats.teachers} teachers`,
        },
        {
            title: 'Students',
            value: stats.students,
            icon: GraduationCap,
            color: 'text-green-600',
            bg: 'bg-green-50',
            sub: 'Enrolled students',
        },
        {
            title: 'Teachers',
            value: stats.teachers,
            icon: UserCheck,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            sub: `${stats.employees} employees`,
        },
        {
            title: 'Active Notices',
            value: stats.activeNotices,
            icon: Bell,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            sub: 'Currently published',
        },
        {
            title: 'Unread Messages',
            value: stats.unreadMessages,
            icon: Mail,
            color: 'text-red-600',
            bg: 'bg-red-50',
            sub: 'Contact form inquiries',
        },
    ];

    const quickLinks = [
        {
            href: '/admin/users',
            icon: Users,
            label: 'Manage Users',
            desc: 'Add students, teachers, and staff accounts.',
            iconColor: 'text-blue-500',
        },
        {
            href: '/admin/notices',
            icon: Bell,
            label: 'Manage Notices',
            desc: 'Post announcements and news for students and staff.',
            iconColor: 'text-yellow-500',
        },
        {
            href: '/admin/gallery',
            icon: Image,
            label: 'Gallery Manager',
            desc: 'Upload and manage photos for the gallery.',
            iconColor: 'text-pink-500',
        },
        {
            href: '/admin/academic',
            icon: Settings,
            label: 'Academic Config',
            desc: 'Manage programs, subjects, and sessions.',
            iconColor: 'text-indigo-500',
        },
        {
            href: '/admin/batches',
            icon: BookOpen,
            label: 'Batches',
            desc: 'Create and manage student batches.',
            iconColor: 'text-teal-500',
        },
        {
            href: '/admin/messages',
            icon: MessageSquare,
            label: 'Contact Messages',
            desc: 'View and reply to inquiries from the contact form.',
            iconColor: 'text-green-500',
        },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome back, Admin! Here's what's happening.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="bg-white border border-gray-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
                            <div className={`p-2 rounded-lg ${stat.bg}`}>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                            <p className="text-xs text-gray-500 mt-1">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {quickLinks.map((item) => (
                        <Link href={item.href} key={item.href}>
                            <Card className="bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-gray-800 text-base">
                                        <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                                        {item.label}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
