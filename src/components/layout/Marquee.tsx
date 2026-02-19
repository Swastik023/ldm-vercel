'use client';

import React from 'react';

const Marquee = () => {
    return (
        <div className="bg-blue-900 text-white overflow-hidden py-2">
            <div className="animate-marquee whitespace-nowrap">
                <span className="mx-4">Welcome to LDM College</span>
                <span className="mx-4">Admissions Open for 2024-25</span>
                <span className="mx-4">Contact us at +91-1234567890</span>
                <span className="mx-4">Welcome to LDM College</span>
                <span className="mx-4">Admissions Open for 2024-25</span>
                <span className="mx-4">Contact us at +91-1234567890</span>
            </div>
        </div>
    );
};

export default Marquee;
