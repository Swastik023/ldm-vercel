'use client';

import React from 'react';
import { Bell } from 'lucide-react';

const NotificationBell = () => {
    return (
        <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
            <Bell className="h-6 w-6" />
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
            </span>
        </button>
    );
};

export default NotificationBell;
