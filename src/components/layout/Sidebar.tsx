'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
    LayoutDashboard, Users, UserCog, GraduationCap,
    BookOpen, ClipboardCheck, Calendar, Settings2,
    Wallet, IndianRupee, Receipt,
    Library, FolderOpen, FileCheck,
    Bell, Megaphone, Image, MessageSquare,
    LogOut, ChevronDown, ChevronRight, HelpCircle, Briefcase,
} from 'lucide-react';

type NavItem = { name: string; href: string; icon: React.ElementType };
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Overview',
        icon: LayoutDashboard,
        items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ],
    },
    {
        label: 'People',
        icon: Users,
        items: [
            { name: 'Students', href: '/admin/students', icon: GraduationCap },
            { name: 'All Users', href: '/admin/users', icon: UserCog },
        ],
    },
    {
        label: 'Academic',
        icon: BookOpen,
        items: [
            { name: 'Configuration', href: '/admin/academic', icon: Settings2 },
            { name: 'Batches', href: '/admin/batches', icon: Calendar },
            { name: 'Assignments', href: '/admin/academic/assignments', icon: BookOpen },
            { name: 'Attendance', href: '/admin/attendance', icon: ClipboardCheck },
        ],
    },
    {
        label: 'Finance',
        icon: Wallet,
        items: [
            { name: 'Finance Dashboard', href: '/admin/finance', icon: Wallet },
            { name: 'Fee Management', href: '/admin/fees', icon: IndianRupee },
            { name: 'Courses', href: '/admin/courses', icon: Receipt },
        ],
    },
    {
        label: 'Library & Docs',
        icon: Library,
        items: [
            { name: 'Library Docs', href: '/admin/library/documents', icon: Library },
            { name: 'Categories', href: '/admin/library/categories', icon: FolderOpen },
            { name: 'Documents', href: '/admin/documents', icon: FileCheck },
        ],
    },
    {
        label: 'Placement',
        icon: Briefcase,
        items: [
            { name: 'Job Portal', href: '/admin/jobs', icon: Briefcase },
        ],
    },
    {
        label: 'Communication',
        icon: Bell,
        items: [
            { name: 'Notices', href: '/admin/notices', icon: Bell },
            { name: 'Scrolling Updates', href: '/admin/marquee', icon: Megaphone },
            { name: 'Gallery', href: '/admin/gallery', icon: Image },
            { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
        ],
    },
];

const Sidebar = () => {
    const pathname = usePathname();

    const isActive = (href: string) => href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

    // Which groups are currently expanded — start with the group that has the active item open
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        const open = new Set<string>();
        for (const group of NAV_GROUPS) {
            if (group.items.some(i => i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)))
                open.add(group.label);
        }
        // Also always open Overview since it has only Dashboard
        open.add('Overview');
        return open;
    });

    const toggle = (label: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    };

    return (
        <aside className="w-60 bg-gray-900 text-white h-screen sticky top-0 flex flex-col shadow-xl flex-shrink-0">
            {/* Logo */}
            <div className="px-5 py-5 border-b border-gray-800/80">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-sm">L</span>
                    </div>
                    <div>
                        <p className="text-white font-bold text-sm leading-tight">LDM Admin</p>
                        <p className="text-gray-500 text-xs">Management Portal</p>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
                {NAV_GROUPS.map(group => {
                    const isOpen = expanded.has(group.label);
                    const hasActive = group.items.some(i => isActive(i.href));
                    return (
                        <div key={group.label}>
                            {/* Group header */}
                            <button
                                onClick={() => toggle(group.label)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${hasActive ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <div className="flex items-center gap-2">
                                    <group.icon className="w-3.5 h-3.5" />
                                    {group.label}
                                </div>
                                {isOpen
                                    ? <ChevronDown className="w-3 h-3 text-gray-600" />
                                    : <ChevronRight className="w-3 h-3 text-gray-600" />}
                            </button>

                            {/* Group items */}
                            {isOpen && (
                                <div className="mt-0.5 mb-1 space-y-0.5">
                                    {group.items.map(item => (
                                        <Link key={item.href} href={item.href}>
                                            <div className={`flex items-center gap-3 pl-7 pr-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                                {item.name}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Help & Sign Out */}
            <div className="p-3 border-t border-gray-800/80 space-y-1.5">
                <Link href="/admin/help">
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${pathname.startsWith('/admin/help')
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}>
                        <HelpCircle className="w-4 h-4 flex-shrink-0" />
                        Help & SOP
                    </div>
                </Link>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition-all text-sm font-semibold"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
