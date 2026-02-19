'use client';

import React from 'react';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <TeacherSidebar />

            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-20 flex justify-between items-center shadow-sm">
                <h2 className="text-xl font-bold text-gray-800">LDM Faculty</h2>
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
                        <TeacherSidebar />
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
