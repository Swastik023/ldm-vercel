'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHome, FaUsers, FaGraduationCap, FaImages, FaAward, FaBuilding,
    FaPhone, FaChevronDown, FaTimes, FaBars, FaHandshake, FaBullhorn,
    FaSignOutAlt, FaUserShield, FaBell, FaBook, FaLeaf, FaUserMd,
} from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react';
import Marquee from '@/components/public/Marquee';

// ─── Notification Bell ─────────────────────────────────────────────────────────
interface Notification { id: number; message: string; is_read: number; created_at: string; }

const NotificationBell = () => {
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        if (!session) return;
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (data.success) { setUnreadCount(data.unread_count ?? 0); setNotifications(data.notifications ?? []); }
        } catch { /* silent */ }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    const markAsRead = async (id: number) => {
        try {
            await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    if (!session) return null;
    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none">
                <FaBell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-xs text-white flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 ring-1 ring-black ring-opacity-5"
                    >
                        <div className="py-2">
                            <h3 className="px-4 py-2 text-sm font-semibold text-gray-900 border-b">Notifications</h3>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length === 0
                                    ? <div className="px-4 py-3 text-sm text-gray-500">No new notifications</div>
                                    : notifications.map(n => (
                                        <div key={n.id} className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${n.is_read ? 'opacity-50' : 'bg-blue-50'}`} onClick={() => markAsRead(n.id)}>
                                            <p className="text-sm text-gray-800">{n.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Slimmed Header ────────────────────────────────────────────────────────────
const Header = () => (
    <motion.header
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="bg-white border-b border-gray-100 py-3"
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4">
                {/* Left — LDM Logo */}
                <Link href="/" aria-label="Home" className="shrink-0">
                    <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-20 group-hover:opacity-50 transition duration-300" />
                        <img src="/ldm-college-logo.jpeg" alt="LDM College" className="h-16 w-16 rounded-full object-contain relative ring-2 ring-gray-200 group-hover:ring-blue-400 transition duration-300" loading="lazy" />
                    </div>
                </Link>

                {/* Centre — Title + Collaboration Badge */}
                <div className="text-center flex-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            LDM College of Pharmacy
                        </span>
                    </h1>
                    {/* Styled collaboration badge — much more visible than plain text */}
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs sm:text-sm font-medium">
                        <FaBuilding className="w-3 h-3 text-teal-500" />
                        In collaboration with Dr. Dharam Dev Hospital &amp; Institute
                    </div>
                </div>

                {/* Right — Hospital Logo + Apply Now CTA */}
                <div className="flex items-center gap-3 shrink-0">
                    <Link href="/hospital" aria-label="Hospital Partner" className="relative group hidden sm:block">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-teal-500 rounded-full blur opacity-20 group-hover:opacity-50 transition duration-300" />
                        <img src="/logo-side.jpeg" alt="Dr. Dharam Dev Hospital" className="h-14 w-14 rounded-full object-contain relative ring-2 ring-gray-200 group-hover:ring-teal-400 transition duration-300" loading="lazy" />
                    </Link>
                    <Link
                        href="/collect-info"
                        className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-violet-300 hover:from-violet-700 hover:to-blue-700 transition-all duration-200 whitespace-nowrap"
                    >
                        <FaGraduationCap className="w-4 h-4" />
                        Apply Now
                    </Link>
                </div>
            </div>
        </div>
    </motion.header>
);

// ─── Nav Data ──────────────────────────────────────────────────────────────────
interface DropdownItem { title: string; path: string; desc?: string; icon?: React.ReactNode; }
interface NavItem { title: string; path: string; dropdown?: DropdownItem[]; isMega?: boolean; }

const navItems: NavItem[] = [
    { title: 'Home', path: '/' },
    {
        title: 'About',
        path: '/about',
        dropdown: [
            { title: 'Overview', path: '/about', desc: 'Our story & mission' },
            { title: 'Our Team', path: '/team', desc: 'Faculty & staff' },
            { title: 'Facilities', path: '/facilities', desc: 'Campus & labs' },
        ],
    },
    { title: 'Notices', path: '/notices' },
    { title: 'E-Library', path: '/library' },
    {
        title: 'Courses',
        path: '/courses',
        dropdown: [
            { title: 'All Courses', path: '/courses', desc: 'Browse all programs' },
            { title: 'Apply Now', path: '/collect-info', desc: 'Start your application' },
        ],
    },
    { title: 'Gallery', path: '/gallery' },
    {
        title: 'Collaborations',
        path: '/collaborations',
        isMega: true,
        dropdown: [
            { title: 'All Partnerships', path: '/collaborations', desc: 'Overview of our network', icon: <FaHandshake className="w-5 h-5 text-teal-500" /> },
            { title: 'Hospital Partners', path: '/hospital', desc: 'Clinical training at Dr. Dharam Dev Hospital', icon: <FaBuilding className="w-5 h-5 text-blue-500" /> },
            { title: 'Ayurvedic Pharma', path: '/ayurvedic-pharma', desc: 'Research & manufacturing exposure', icon: <FaLeaf className="w-5 h-5 text-green-500" /> },
            { title: 'Vaidya Saurabh', path: '/vaid-saurabh', desc: 'Expert Ayurvedic mentorship', icon: <FaUserMd className="w-5 h-5 text-purple-500" /> },
        ],
    },
    { title: 'Contact', path: '/contact' },
];

const iconMap: Record<string, React.ReactNode> = {
    'Home': <FaHome className="w-4 h-4 text-blue-600" />,
    'About': <FaUsers className="w-4 h-4 text-green-600" />,
    'Notices': <FaBullhorn className="w-4 h-4 text-red-500" />,
    'E-Library': <FaBook className="w-4 h-4 text-indigo-600" />,
    'Courses': <FaGraduationCap className="w-4 h-4 text-purple-600" />,
    'Gallery': <FaImages className="w-4 h-4 text-pink-600" />,
    'Collaborations': <FaHandshake className="w-4 h-4 text-teal-600" />,
    'Contact': <FaPhone className="w-4 h-4 text-teal-600" />,
};

// ─── Main Navbar ───────────────────────────────────────────────────────────────
const PublicNavbar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { setIsOpen(false); setActiveDropdown(null); }, [pathname]);

    const openDropdown = (title: string) => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        setActiveDropdown(title);
    };
    const scheduleClose = () => {
        closeTimer.current = setTimeout(() => setActiveDropdown(null), 120);
    };

    const isActiveParent = (item: NavItem) =>
        pathname === item.path || (item.dropdown?.some(d => pathname === d.path) ?? false);

    const dashboardPath =
        !session ? '/login'
            : session.user?.role === 'admin' ? '/admin'
                : session.user?.role === 'teacher' ? '/teacher'
                    : session.user?.role === 'employee' ? '/employee'
                        : '/student';

    return (
        <div className="bg-white w-full z-50">
            <Header />
            <Marquee />

            {/* ── Sticky Nav Bar ── */}
            <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-14 items-center justify-between">

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
                            {navItems.map(item => (
                                <div
                                    key={item.title}
                                    className="relative"
                                    onMouseEnter={() => item.dropdown && openDropdown(item.title)}
                                    onMouseLeave={scheduleClose}
                                >
                                    <Link
                                        href={item.path}
                                        className={`inline-flex items-center gap-1.5 px-3 py-4 text-sm font-medium transition-colors border-b-2 ${isActiveParent(item)
                                                ? 'text-blue-600 border-blue-600'
                                                : 'text-gray-700 hover:text-blue-600 border-transparent hover:border-blue-300'
                                            }`}
                                    >
                                        {iconMap[item.title]}
                                        {item.title}
                                        {item.dropdown && (
                                            <motion.span animate={{ rotate: activeDropdown === item.title ? 180 : 0 }} transition={{ duration: 0.25 }}>
                                                <FaChevronDown className="h-2.5 w-2.5" />
                                            </motion.span>
                                        )}
                                    </Link>

                                    {/* ── Mega-Menu (Collaborations) ── */}
                                    <AnimatePresence>
                                        {item.dropdown && item.isMega && activeDropdown === item.title && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute left-1/2 -translate-x-1/2 mt-0 w-[520px] bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden z-50"
                                                onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
                                                onMouseLeave={scheduleClose}
                                            >
                                                <div className="p-4 grid grid-cols-2 gap-2">
                                                    {item.dropdown.map((d, i) => (
                                                        <Link
                                                            key={d.title}
                                                            href={d.path}
                                                            className={`flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group ${i === 0 ? 'col-span-2 bg-gray-50' : ''}`}
                                                        >
                                                            <div className="mt-0.5 shrink-0 p-2 rounded-lg bg-white shadow-sm group-hover:shadow-md transition-shadow">
                                                                {d.icon}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900 text-sm">{d.title}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{d.desc}</p>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                                <div className="px-4 py-3 bg-gradient-to-r from-teal-50 to-blue-50 border-t border-gray-100">
                                                    <Link href="/collaborations" className="text-xs text-teal-700 font-semibold hover:underline">
                                                        View all partnerships →
                                                    </Link>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* ── Regular Dropdown ── */}
                                        {item.dropdown && !item.isMega && activeDropdown === item.title && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                                transition={{ duration: 0.18 }}
                                                className="absolute left-1/2 -translate-x-1/2 mt-0 w-52 bg-white rounded-xl shadow-xl ring-1 ring-black/5 overflow-hidden z-50"
                                                onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
                                                onMouseLeave={scheduleClose}
                                            >
                                                <div className="py-2">
                                                    {item.dropdown.map(d => (
                                                        <Link
                                                            key={d.title}
                                                            href={d.path}
                                                            className="flex flex-col px-4 py-2.5 hover:bg-blue-50 transition-colors"
                                                        >
                                                            <span className="text-sm font-medium text-gray-800">{d.title}</span>
                                                            {d.desc && <span className="text-xs text-gray-500">{d.desc}</span>}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Auth Controls */}
                        <div className="hidden md:flex items-center gap-2">
                            {session ? (
                                <>
                                    <NotificationBell />
                                    <Link href={dashboardPath} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                                        <FaUserShield className="w-4 h-4" /> Dashboard
                                    </Link>
                                    <button onClick={() => signOut({ callbackUrl: '/' })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
                                        <FaSignOutAlt className="w-4 h-4" /> Logout
                                    </button>
                                </>
                            ) : (
                                <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium hover:shadow-lg transition-shadow">
                                    <FaUsers className="w-4 h-4" /> Login
                                </Link>
                            )}
                        </div>

                        {/* Mobile — Hamburger */}
                        <div className="md:hidden flex items-center gap-2">
                            {session && <NotificationBell />}
                            <button onClick={() => { setIsOpen(p => !p); setActiveDropdown(null); }} className="text-gray-700 hover:text-blue-600 p-2">
                                {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Mobile Menu ── */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t bg-white overflow-hidden"
                        >
                            <div className="px-4 py-3 space-y-1 max-h-[75vh] overflow-y-auto">
                                {/* Apply Now — prominent at top for mobile */}
                                <Link href="/collect-info" className="flex items-center justify-center gap-2 py-3 mb-2 bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl font-semibold text-sm" onClick={() => setIsOpen(false)}>
                                    <FaGraduationCap /> Apply Now
                                </Link>

                                {navItems.map(item => (
                                    <div key={item.title}>
                                        {item.dropdown ? (
                                            <>
                                                <button
                                                    onClick={() => setActiveDropdown(p => p === item.title ? null : item.title)}
                                                    className="w-full flex items-center justify-between py-3 text-gray-700 font-medium text-sm"
                                                >
                                                    <span className="flex items-center gap-2">{iconMap[item.title]}{item.title}</span>
                                                    <FaChevronDown className={`transition-transform text-xs ${activeDropdown === item.title ? 'rotate-180' : ''}`} />
                                                </button>
                                                {activeDropdown === item.title && (
                                                    <div className="pl-7 pb-2 space-y-0.5 border-l-2 border-blue-100 ml-2">
                                                        {item.dropdown.map(d => (
                                                            <Link key={d.title} href={d.path} className="block py-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => setIsOpen(false)}>
                                                                {d.title}
                                                                {d.desc && <span className="text-xs text-gray-400 block">{d.desc}</span>}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Link href={item.path} className="flex items-center gap-2 py-3 text-gray-700 font-medium text-sm hover:text-blue-600" onClick={() => setIsOpen(false)}>
                                                {iconMap[item.title]}{item.title}
                                            </Link>
                                        )}
                                    </div>
                                ))}

                                <div className="border-t pt-3 mt-2 space-y-1">
                                    {session ? (
                                        <>
                                            <Link href={dashboardPath} className="block py-2 text-blue-600 font-medium text-sm" onClick={() => setIsOpen(false)}>Dashboard</Link>
                                            <button onClick={() => { signOut({ callbackUrl: '/' }); setIsOpen(false); }} className="block py-2 text-red-600 font-medium text-sm w-full text-left">Logout</button>
                                        </>
                                    ) : (
                                        <Link href="/login" className="block py-2 text-blue-600 font-medium text-sm" onClick={() => setIsOpen(false)}>Login</Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </div>
    );
};

export default PublicNavbar;
