'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    LogOut,
    Menu
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const EmployeeSidebar = () => {
    const pathname = usePathname();

    const menuItems = [
        { title: 'Dashboard', path: '/employee', icon: <LayoutDashboard size={20} /> },
        // Add more employee items if needed
    ];

    return (
        <div className="bg-white h-screen w-64 fixed left-0 top-0 border-r border-gray-200 flex flex-col z-10 hidden md:flex">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600">
                    LDM Staff
                </h2>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        href={item.path}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${pathname === item.path
                                ? 'bg-teal-50 text-teal-600 font-medium shadow-sm'
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

export default function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <EmployeeSidebar />

            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">LDM Staff</h2>
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="bg-white w-64 h-full" onClick={e => e.stopPropagation()}>
                        <EmployeeSidebar />
                    </div>
                </div>
            )}

            <main className="md:ml-64 min-h-screen">
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
