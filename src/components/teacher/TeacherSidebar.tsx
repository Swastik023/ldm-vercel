'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ClipboardCheck,
    GraduationCap,
    LogOut
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const TeacherSidebar = () => {
    const pathname = usePathname();

    const menuItems = [
        { title: 'Dashboard', path: '/teacher', icon: <LayoutDashboard size={20} /> },
        { title: 'Attendance', path: '/teacher/attendance', icon: <ClipboardCheck size={20} /> },
        { title: 'Marks Entry', path: '/teacher/marks', icon: <GraduationCap size={20} /> },
    ];

    return (
        <div className="bg-white h-screen w-64 fixed left-0 top-0 border-r border-gray-200 flex flex-col z-10 hidden md:flex">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                    LDM Faculty
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === item.path
                                ? 'bg-amber-50 text-amber-600 font-medium shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        {item.icon}
                        <span>{item.title}</span>
                    </Link>
                ))}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default TeacherSidebar;
