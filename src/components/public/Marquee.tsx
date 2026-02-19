'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const Marquee: React.FC = () => {
    const [items, setItems] = useState<{ text: string }[]>([]);

    useEffect(() => {
        fetch('/api/public/marquee')
            .then(res => res.json())
            .then(data => {
                if (data.success && Array.isArray(data.messages)) {
                    const formattedItems = data.messages.map((msg: { message: string }) => ({
                        text: msg.message
                    }));
                    setItems(formattedItems);
                } else {
                    setItems([
                        { text: "Welcome to LDM College" },
                        { text: "Admissions Open for 2026 Batch" },
                        { text: "New Paramedical Courses Announced" },
                    ]);
                }
            })
            .catch(() => {
                setItems([
                    { text: "Welcome to LDM College" },
                    { text: "Admissions Open for 2026 Batch" },
                    { text: "New Paramedical Courses Announced" },
                ]);
            });
    }, []);

    if (items.length === 0) return null;

    return (
        <div className="bg-blue-900 text-white py-2 overflow-hidden relative z-50 border-b border-blue-800">
            <div className="flex items-center">
                <span className="bg-blue-800 px-3 py-1 text-xs font-bold uppercase tracking-wider ml-2 z-10 shadow-md text-white whitespace-nowrap">
                    📢 Updates
                </span>
                <div className="w-full overflow-hidden flex">
                    <motion.div
                        className="flex whitespace-nowrap"
                        animate={{ x: ["50%", "-100%"] }}
                        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                    >
                        {items.map((item, idx) => (
                            <span key={idx} className="mx-12 font-medium text-sm flex items-center">
                                {item.text}
                            </span>
                        ))}
                        {items.map((item, idx) => (
                            <span key={`dup-${idx}`} className="mx-12 font-medium text-sm flex items-center">
                                {item.text}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Marquee;
