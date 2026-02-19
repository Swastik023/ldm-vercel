'use client';

import React from 'react';

const MissionVision = () => {
    const [content, setContent] = React.useState({ mission_vision: '' });

    React.useEffect(() => {
        // Mock fetch or backend integration later
        // fetch('/api/public/content')...
    }, []);

    return (
        <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">Mission & Vision</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                    <div className="text-gray-600 whitespace-pre-wrap">
                        {content.mission_vision ? (
                            content.mission_vision
                        ) : (
                            "To provide excellence in medical education and healthcare services while fostering innovation and compassion."
                        )}
                    </div>
                </div>
                <div>
                    <h2 className="text-2xl font-semibold mb-4">Our Vision</h2>
                    <p className="text-gray-600">
                        To be a leading institution in medical education, research, and patient care.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MissionVision;
