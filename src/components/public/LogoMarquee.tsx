'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoMarqueeProps {
    logos?: { src: string; alt: string }[];
    className?: string;
}

const defaultLogos = [
    // Add placeholder logos until you provide the actual ones
    { src: '/mark-logo-1.jpeg', alt: 'Company 1' },
    { src: '/mark-logo-2.jpeg', alt: 'Company 2' },
    { src: '/mark-logo-3.jpeg', alt: 'Company 3' },
];

const LogoMarquee: React.FC<LogoMarqueeProps> = ({ logos = defaultLogos, className = '' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % logos.length);
        }, 3000); // Change image every 3 seconds

        return () => clearInterval(timer);
    }, [logos.length]);

    return (
        <div className={`w-full overflow-hidden bg-white py-4 sm:py-8 ${className}`}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
            >
                <h3 className="text-center text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6">
                    Our Partner Companies
                </h3>

                <div className="relative flex justify-center items-center h-[150px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.5 }}
                            className="flex items-center justify-center"
                        >
                            <img
                                src={logos[currentIndex].src}
                                alt={logos[currentIndex].alt}
                                className="h-24 sm:h-32 w-auto object-contain hover:scale-105 transition-transform duration-300"
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default LogoMarquee;
