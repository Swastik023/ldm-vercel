import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Information Collection - LDM Paramedical',
    description: 'Submit your information to LDM Paramedical',
};

const CollectInfo: React.FC = () => {
    return (
        <div className="flex-1 w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 py-2 min-h-screen">
            <div className="max-w-[95%] mx-auto min-h-[calc(100vh-5rem)]">
                <div className="text-center mb-4 pt-4">
                    <h1 className="text-2xl font-bold text-gray-900">LDM College Course Registration Form</h1>
                    <p className="text-sm text-gray-600">Please fill out the form below to register for a course</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-4 h-[800px]">
                    <iframe
                        width="100%"
                        height="100%"
                        src="https://forms.office.com/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAANAAoMiClhUNVpMR1M4SkpXT0g5TlJLVDdHUEpENzdORS4u&embed=true"
                        style={{
                            border: 'none',
                            maxWidth: '100%',
                            maxHeight: '100vh'
                        }}
                        allowFullScreen
                    />
                </div>

                <div className="mt-4 text-center text-xs text-gray-500 pb-4">
                    <p>Having trouble with the form? Contact us at support@ldmparamedical.com</p>
                </div>
            </div>
        </div>
    );
};

export default CollectInfo;
