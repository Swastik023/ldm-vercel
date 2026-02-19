'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface IconWrapperProps {
    children: React.ReactNode;
    color?: 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'teal';
    className?: string;
}

const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    teal: 'bg-teal-500'
};

const IconWrapper: React.FC<IconWrapperProps> = ({
    children,
    color = "blue",
    className = ""
}) => {
    const baseClasses = `inline-flex items-center justify-center ${colorClasses[color]} p-3 rounded-lg shadow-md`;
    const combinedClasses = `${baseClasses} ${className}`.trim();

    return (
        <motion.div
            whileHover={{
                scale: 1.1,
                y: -2,
            }}
            transition={{
                duration: 0.2,
                ease: "easeOut",
            }}
            className={combinedClasses}
        >
            {children}
        </motion.div>
    );
};

export default IconWrapper;
