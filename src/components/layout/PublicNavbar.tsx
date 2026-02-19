'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaHome,
    FaUsers,
    FaGraduationCap,
    FaImages,
    FaAward,
    FaBuilding,
    FaPhone,
    FaChevronDown,
    FaTimes,
    FaBars,
    FaHandshake,
    FaBullhorn,
    FaSignOutAlt,
    FaUserShield,
    FaBell,
} from 'react-icons/fa';
import { useSession, signOut } from 'next-auth/react';
import Marquee from '@/components/public/Marquee';

// ─── Notification Bell ────────────────────────────────────────────────────────
interface Notification {
    id: number;
    message: string;
    is_read: number;
    created_at: string;
}

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
            if (data.success) {
                setUnreadCount(data.unread_count ?? 0);
                setNotifications(data.notifications ?? []);
            }
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
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch { /* silent */ }
    };

    if (!session) return null;

    return (
        <div className="relative">
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none">
                <FaBell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-xs text-white flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl overflow-hidden z-50 ring-1 ring-black ring-opacity-5"
                    >
                        <div className="py-2">
                            <h3 className="px-4 py-2 text-sm font-semibold text-gray-900 border-b">Notifications</h3>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="px-4 py-3 text-sm text-gray-500">No new notifications</div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${n.is_read ? 'opacity-50' : 'bg-blue-50'}`}
                                            onClick={() => markAsRead(n.id)}
                                        >
                                            <p className="text-sm text-gray-800">{n.message}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Header (Logo Section) ────────────────────────────────────────────────────
const Header = () => (
    <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-md py-4"
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                {/* Left Logos */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="flex items-center space-x-3"
                >
                    <Link href="/" aria-label="Home" className="hover:opacity-90 transition-opacity min-w-[5rem] sm:min-w-[5.5rem]">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-300" />
                            <img
                                src="/ldm-college-logo.jpeg"
                                alt="LDM College Logo"
                                className="h-20 w-20 sm:h-[5.5rem] sm:w-[5.5rem] rounded-full object-contain relative ring-2 ring-gray-700/30 group-hover:ring-blue-500/50 transition duration-300"
                                loading="lazy"
                            />
                        </div>
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="relative group hidden sm:block"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-300" />
                        <img
                            src="/logo-side1.jpeg"
                            alt="LDM College Secondary Logo"
                            className="h-16 sm:h-20 w-16 sm:w-20 rounded-full object-contain relative ring-2 ring-gray-700/30 group-hover:ring-purple-500/50 transition duration-300"
                            loading="lazy"
                        />
                    </motion.div>
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-center flex-grow flex flex-col justify-center"
                >
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-purple-600 hover:to-blue-600 bg-clip-text text-transparent transition-all duration-700 ease-in-out">
                            LDM College
                        </span>
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-gray-700 font-medium mt-1">
                        In collaboration with Dr. Dharam Dev Hospital &amp; Institute
                    </p>
                </motion.div>

                {/* Right Logos */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex items-center space-x-3"
                >
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="relative group hidden sm:block"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-300" />
                        <img
                            src="/logo-side.jpeg"
                            alt="Dr. Dharam Dev Hospital Logo"
                            className="h-16 sm:h-20 w-16 sm:w-20 rounded-full object-contain relative ring-2 ring-gray-700/30 group-hover:ring-green-500/50 transition duration-300"
                            loading="lazy"
                        />
                    </motion.div>

                    <Link href="/hospital" className="relative group hidden sm:block" aria-label="Visit Hospital Page">
                        <motion.img
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            src="/hospital.png"
                            alt="Hospital Building"
                            className="h-16 sm:h-20 w-auto hover:opacity-90 transition-opacity duration-300"
                            loading="lazy"
                        />
                    </Link>
                </motion.div>
            </div>
        </div>
    </motion.header>
);

// ─── Nav Items ────────────────────────────────────────────────────────────────
interface DropdownItem { title: string; path: string; }
interface NavItem { title: string; path: string; dropdown?: DropdownItem[]; }

const navItems: NavItem[] = [
    { title: 'Home', path: '/' },
    {
        title: 'About Us',
        path: '/about',
        dropdown: [
            { title: 'Overview', path: '/about' },
            { title: 'Mission & Vision', path: '/mission' },
            { title: 'Our Team', path: '/team' },
        ],
    },
    { title: 'Notices', path: '/notices' },
    {
        title: 'Courses',
        path: '/courses',
        dropdown: [
            { title: 'All Courses', path: '/courses' },
            { title: 'Apply for Courses', path: '/collect-info' },
        ],
    },
    { title: 'Gallery', path: '/gallery' },
    { title: 'Facilities', path: '/facilities' },
    {
        title: 'Collaborations',
        path: '/collaborations',
        dropdown: [
            { title: 'Overview', path: '/collaborations' },
            { title: 'Hospital Partners', path: '/hospital' },
            { title: 'Ayurvedic Pharma', path: '/ayurvedic-pharma' },
            { title: 'Vaidya Saurabh', path: '/vaid-saurabh' },
        ],
    },
    {
        title: 'Contact',
        path: '/contact',
        dropdown: [
            { title: 'Contact Us', path: '/contact' },
            { title: 'Apply for Courses', path: '/collect-info' },
        ],
    },
];

const iconMap: Record<string, React.ReactNode> = {
    'Home': <FaHome className="w-5 h-5 text-blue-600" />,
    'About Us': <FaUsers className="w-5 h-5 text-green-600" />,
    'Notices': <FaBullhorn className="w-5 h-5 text-red-500" />,
    'Courses': <FaGraduationCap className="w-5 h-5 text-purple-600" />,
    'Gallery': <FaImages className="w-5 h-5 text-pink-600" />,
    'Facilities': <FaAward className="w-5 h-5 text-orange-600" />,
    'Collaborations': <FaHandshake className="w-5 h-5 text-teal-600" />,
    'Contact': <FaPhone className="w-5 h-5 rotate-180 text-teal-600" />,
};

// ─── Main Navbar ──────────────────────────────────────────────────────────────
const PublicNavbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Close menu on route change
    useEffect(() => {
        setIsOpen(false);
        setActiveDropdown(null);
    }, [pathname]);

    const toggleMenu = () => { setIsOpen(p => !p); setActiveDropdown(null); };
    const toggleDropdown = (title: string | null) => setActiveDropdown(p => p === title ? null : title);

    const isActiveParent = (item: NavItem): boolean => {
        if (pathname === item.path) return true;
        return item.dropdown?.some(d => pathname === d.path) ?? false;
    };

    const dashboardPath =
        !session ? '/login'
            : session.user?.role === 'admin' ? '/admin'
                : session.user?.role === 'teacher' ? '/teacher'
                    : session.user?.role === 'employee' ? '/employee'
                        : '/student';

    return (
        <div className="bg-white w-full z-50">
            {/* Top logo header */}
            <Header />

            {/* Marquee / notice bar */}
            <Marquee />

            {/* Sticky nav bar */}
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center h-16 relative">
                        {/* Mobile: hamburger on right */}
                        <div className="absolute right-0 top-0 h-full flex items-center md:hidden gap-3 pr-2">
                            {session && <NotificationBell />}
                            <button onClick={toggleMenu} className="text-gray-700 hover:text-blue-600 p-2">
                                {isOpen ? <FaTimes size={22} /> : <FaBars size={22} />}
                            </button>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex space-x-1 justify-center items-center">
                            {navItems.map(item => (
                                <div
                                    key={item.title}
                                    className="relative group"
                                    onMouseEnter={() => item.dropdown && toggleDropdown(item.title)}
                                    onMouseLeave={() => toggleDropdown(null)}
                                >
                                    <Link
                                        href={item.path}
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className={`inline-flex items-center gap-2 px-3 py-5 text-base font-medium transition-colors ${isActiveParent(item) ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
                                    >
                                        {iconMap[item.title]}
                                        {item.title}
                                        {item.dropdown && (
                                            <motion.span
                                                animate={{ rotate: activeDropdown === item.title ? 180 : 0 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <FaChevronDown className="h-3 w-3" />
                                            </motion.span>
                                        )}
                                    </Link>

                                    {/* Dropdown */}
                                    <AnimatePresence>
                                        {item.dropdown && activeDropdown === item.title && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute left-1/2 transform -translate-x-1/2 mt-0 w-max bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden z-50"
                                            >
                                                <div className="py-2 px-1">
                                                    {item.dropdown.map((d, i) => (
                                                        <motion.div
                                                            key={d.title}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ duration: 0.2, delay: i * 0.05 }}
                                                            whileHover={{ x: 5 }}
                                                        >
                                                            <Link
                                                                href={d.path}
                                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors whitespace-nowrap"
                                                            >
                                                                {d.title}
                                                            </Link>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}

                            {/* Auth Controls */}
                            <div className="flex items-center gap-2 ml-2">
                                {session ? (
                                    <>
                                        <NotificationBell />
                                        <Link
                                            href={dashboardPath}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                                        >
                                            <FaUserShield />
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
                                        >
                                            <FaSignOutAlt />
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-medium hover:shadow-lg transition-shadow"
                                    >
                                        <FaUsers />
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t bg-white overflow-hidden"
                        >
                            <div className="px-4 py-3 space-y-1">
                                {navItems.map(item => (
                                    <div key={item.title}>
                                        {item.dropdown ? (
                                            <>
                                                <button
                                                    onClick={() => toggleDropdown(item.title)}
                                                    className="w-full flex items-center justify-between py-3 text-gray-700 font-medium"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {iconMap[item.title]}
                                                        {item.title}
                                                    </div>
                                                    <FaChevronDown className={`transition-transform ${activeDropdown === item.title ? 'rotate-180' : ''}`} />
                                                </button>
                                                {activeDropdown === item.title && (
                                                    <div className="pl-8 pb-2 space-y-1">
                                                        {item.dropdown.map(d => (
                                                            <Link
                                                                key={d.title}
                                                                href={d.path}
                                                                className="block py-2 text-sm text-gray-600 hover:text-blue-600"
                                                                onClick={toggleMenu}
                                                            >
                                                                {d.title}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <Link
                                                href={item.path}
                                                className="flex items-center gap-2 py-3 text-gray-700 font-medium hover:text-blue-600"
                                                onClick={toggleMenu}
                                            >
                                                {iconMap[item.title]}
                                                {item.title}
                                            </Link>
                                        )}
                                    </div>
                                ))}

                                <div className="border-t pt-3 mt-2 space-y-1">
                                    {session ? (
                                        <>
                                            <Link href={dashboardPath} className="block py-2 text-blue-600 font-medium" onClick={toggleMenu}>
                                                Dashboard
                                            </Link>
                                            <button
                                                onClick={() => { signOut({ callbackUrl: '/' }); toggleMenu(); }}
                                                className="block py-2 text-red-600 font-medium w-full text-left"
                                            >
                                                Logout
                                            </button>
                                        </>
                                    ) : (
                                        <Link href="/login" className="block py-2 text-blue-600 font-medium" onClick={toggleMenu}>
                                            Login
                                        </Link>
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
