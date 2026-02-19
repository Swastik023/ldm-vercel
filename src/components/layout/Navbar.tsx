'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
    FaUserShield
} from 'react-icons/fa';
import Marquee from './Marquee';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from './NotificationBell';

const Header = () => {
    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-50 shadow-md py-4"
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    {/* Logo Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="flex items-center px-2 sm:px-0 space-x-3"
                    >
                        <Link
                            href="/"
                            className="hover:opacity-90 transition-opacity min-w-[5rem] sm:min-w-[5.5rem]"
                            aria-label="Home"
                        >
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                                <img
                                    src="/ldm-college-logo.jpeg"
                                    alt="LDM College Logo"
                                    className="h-20 w-20 xs:h-[5rem] xs:w-[5rem] sm:h-[5.5rem] sm:w-[5.5rem] rounded-full object-contain relative ring-2 ring-gray-700/30 group-hover:ring-blue-500/50 transition duration-300"
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
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                            <img
                                src="/logo-side1.jpeg"
                                alt="LDM College Secondary Logo"
                                className="h-16 sm:h-20 w-16 sm:w-20 rounded-full object-contain relative ring-2 ring-gray-700/30 group-hover:ring-purple-500/50 transition duration-300"
                                loading="lazy"
                            />
                        </motion.div>
                    </motion.div>

                    {/* Title Section */}
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
                            In collaboration with Dr. Dharam Dev Hospital & Institute
                        </p>
                    </motion.div>

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
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                            <img
                                src="/logo-side.jpeg"
                                alt="Dr. Dharam Dev Hospital Logo"
                                className="h-16 sm:h-20 w-16 sm:w-20 rounded-full object-contain relative ring-2 ring-gray-700/30 group-hover:ring-green-500/50 transition duration-300"
                                loading="lazy"
                            />
                        </motion.div>

                        <Link
                            href="/hospital"
                            className="relative group hidden sm:block"
                            aria-label="Visit Hospital Page"
                        >
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
};

interface DropdownItem {
    title: string;
    path: string;
}

interface NavItem {
    title: string;
    path: string;
    dropdown?: DropdownItem[];
    isExternal?: boolean;
}

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const pathname = usePathname();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, logout } = useAuth() || { user: null, logout: () => { } };

    // Close mobile menu when route changes
    useEffect(() => {
        setIsOpen(false);
        setActiveDropdown(null);
    }, [pathname]);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        setActiveDropdown(null);
    };

    const toggleDropdown = (title: string | null) => {
        setActiveDropdown(activeDropdown === title ? null : title);
    };

    const getIcon = (title: string) => {
        const iconStyle = `transition-all duration-300 transform ${hoveredIcon === title ? 'scale-125 rotate-12' : ''}`;

        switch (title) {
            case 'Home':
                return <FaHome className="w-5 h-5 text-blue-600" />;
            case 'About Us':
                return <FaUsers className="w-5 h-5 text-green-600" />;
            case 'Notices':
                return <FaBullhorn className="w-5 h-5 text-red-500" />;
            case 'Courses':
                return <FaGraduationCap className="w-5 h-5 text-purple-600" />;
            case 'Gallery':
                return <FaImages className="w-5 h-5 text-pink-600" />;
            case 'Facilities':
                return <FaAward className="w-5 h-5 text-orange-600" />;
            case 'Hospital':
                return <FaBuilding className="w-5 h-5 text-red-600" />;
            case 'Collaborations':
                return <FaHandshake className="w-5 h-5 text-teal-600" />;
            case 'Contact':
                return <FaPhone className="w-5 h-5 rotate-180 text-teal-600" />;
            case 'Login':
                return <FaUsers className="w-5 h-5 text-indigo-600" />;
            default:
                return null;
        }
    };

    const navItems: NavItem[] = [
        { title: 'Home', path: '/' },
        {
            title: 'About Us',
            path: '/about',
            dropdown: [
                { title: 'Overview', path: '/about' },
                { title: 'Mission & Vision', path: '/about/mission-vision' },
                { title: 'Our Team', path: '/team' }
            ],
        },
        { title: 'Notices', path: '/notices' },
        {
            title: 'Courses',
            path: '/courses',
            dropdown: [
                { title: 'All Courses', path: '/courses' },
                { title: 'Apply for Courses', path: '/collect-info' }
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
                { title: 'Vaidya Saurabh', path: '/vaid-saurabh' }
            ]
        },
        {
            title: 'Contact',
            path: '/contact',
            dropdown: [
                { title: 'Contact Us', path: '/contact' },
                { title: 'Apply for Courses', path: '/collect-info' }
            ]
        },
        {
            title: 'Login',
            path: '/login', // Redirect to Next.js login
            isExternal: false
        }
    ];

    const isActiveParent = (item: NavItem): boolean => {
        if (pathname === item.path) return true;
        if (item.dropdown) {
            return item.dropdown.some((dropItem) => pathname === dropItem.path);
        }
        return false;
    };

    return (
        <>
            <Header />
            <Marquee />
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center h-16 relative">
                        {/* Desktop Menu */}
                        <div className="hidden md:flex space-x-8 justify-center items-center">
                            {navItems.map((item) => (
                                <div
                                    key={item.title}
                                    className="relative group"
                                    onMouseEnter={() => toggleDropdown(item.title)}
                                    onMouseLeave={() => toggleDropdown(null)}
                                >
                                    {/* Combined logic for brevity, implementing similar to original */}
                                    <Link
                                        href={item.path}
                                        className={`inline-flex items-center px-3 pt-1 text-lg font-medium transition-colors ${isActiveParent(item) ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600'}`}
                                        onMouseEnter={() => setHoveredIcon(item.title)}
                                        onMouseLeave={() => setHoveredIcon(null)}
                                    >
                                        <span className="mr-2">
                                            {getIcon(item.title)}
                                        </span>
                                        {item.title}
                                        {item.dropdown && (
                                            <FaChevronDown className="ml-1 h-4 w-4" />
                                        )}
                                    </Link>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {item.dropdown && activeDropdown === item.title && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-max bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden"
                                            >
                                                <div className="py-2 px-4">
                                                    <div className="grid grid-cols-1 gap-1">
                                                        {item.dropdown.map((dropItem, index) => (
                                                            <motion.div
                                                                key={dropItem.title}
                                                                initial={{ opacity: 0, x: -20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                                                whileHover={{ x: 5 }}
                                                            >
                                                                <Link
                                                                    href={dropItem.path}
                                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                                                >
                                                                    {dropItem.title}
                                                                </Link>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden absolute right-0 top-1/2 transform -translate-y-1/2">
                            <button
                                onClick={toggleMenu}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 focus:outline-none"
                            >
                                {isOpen ? <FaTimes className="block h-6 w-6" /> : <FaBars className="block h-6 w-6" />}
                            </button>
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
                            transition={{ duration: 0.3 }}
                            className="md:hidden fixed top-16 left-0 right-0 bg-white shadow-lg"
                        >
                            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto">
                                <div className="pt-2 pb-3 space-y-1">
                                    {navItems.map((item, index) => (
                                        <motion.div
                                            key={item.title}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1, duration: 0.3 }}
                                        >
                                            <button
                                                onClick={() => toggleDropdown(item.title)}
                                                className={`w-full flex items-center justify-between pl-3 pr-4 py-2 text-base font-medium transition-colors ${isActiveParent(item) ? 'text-blue-600 bg-gray-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <Link href={item.path} className="flex-1 flex items-center" onClick={(e) => e.stopPropagation()}>
                                                    <span className="mr-2">{getIcon(item.title)}</span>
                                                    {item.title}
                                                </Link>
                                                {item.dropdown && (
                                                    <FaChevronDown className={`ml-1 h-4 w-4 transition-transform ${activeDropdown === item.title ? 'rotate-180' : ''}`} />
                                                )}
                                            </button>
                                            <AnimatePresence>
                                                {item.dropdown && activeDropdown === item.title && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="pl-4"
                                                    >
                                                        {item.dropdown.map((dropItem, dropIndex) => (
                                                            <motion.div
                                                                key={dropItem.title}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                transition={{ delay: dropIndex * 0.05, duration: 0.2 }}
                                                            >
                                                                <Link
                                                                    href={dropItem.path}
                                                                    className="block pl-3 pr-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                                                                    onClick={toggleMenu}
                                                                >
                                                                    {dropItem.title}
                                                                </Link>
                                                            </motion.div>
                                                        ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
};

export default Navbar;
