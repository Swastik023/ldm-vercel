'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Bell,
    Image,
    MessageSquare,
    Users,
    Settings,
    BookOpen,
    Calendar,
    ClipboardCheck,
    Library,
    LogOut,
    Megaphone,
} from 'lucide-react';

const Sidebar = () => {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Manage Users', href: '/admin/users', icon: Users },
        { name: 'Academic Config', href: '/admin/academic', icon: Settings },
        { name: 'Batches', href: '/admin/batches', icon: Calendar },
        { name: 'Assignments', href: '/admin/academic/assignments', icon: BookOpen },
        { name: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck },
        { name: 'Library', href: '/admin/library', icon: Library },
        { name: 'Scrolling Updates', href: '/admin/marquee', icon: Megaphone },
        { name: 'Notices', href: '/admin/notices', icon: Bell },
        { name: 'Gallery', href: '/admin/gallery', icon: Image },
        { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    ];

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin';
        return pathname.startsWith(href);
    };

    return (
        <aside className="w-64 bg-gray-900 text-white h-screen sticky top-0 flex flex-col shadow-xl">
            <div className="p-6 border-b border-gray-800">
                <h2 className="text-xl font-bold tracking-wider text-blue-400">LDM Admin</h2>
                <p className="text-xs text-gray-500 mt-1">Management Portal</p>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => (
                    <Link key={item.name} href={item.href}>
                        <div
                            className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${isActive(item.href)
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            <item.icon
                                className={`h-5 w-5 mr-3 flex-shrink-0 ${isActive(item.href) ? 'text-white' : 'text-gray-400 group-hover:text-white'
                                    }`}
                            />
                            <span className="font-medium text-sm">{item.name}</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center justify-center p-3 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200"
                >
                    <LogOut className="h-5 w-5 mr-2" />
                    <span className="font-medium text-sm">Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
