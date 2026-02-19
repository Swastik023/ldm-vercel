'use client';

import React, { useEffect, useState } from 'react';
import { FaBell } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface Notification {
    id: number;
    message: string;
    is_read: number; // 0 or 1
    created_at: string;
}

const NotificationBell: React.FC = () => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        // Mocking fetching for now until API is ready
        // try {
        //     const res = await fetch('/api/notifications', { ... });
        //     ...
        // } catch (error) { ... }
    };

    useEffect(() => {
        fetchNotifications();
        // const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        // return () => clearInterval(interval);
    }, [user]);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
    };

    const markAsRead = async (id: number) => {
        // Mock mark as read
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    };


    if (!user) return null;

    return (
        <div className="relative">
            <button onClick={handleBellClick} className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none">
                <FaBell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white text-xs text-white text-center leading-none flex items-center justify-center">
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

export default NotificationBell;
