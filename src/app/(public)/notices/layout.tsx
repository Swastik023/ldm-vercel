import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Notices & Announcements',
    description: 'Stay updated with the latest notices, exam schedules, and announcements from LDM College.',
    keywords: ["LDM college notices","pharmacy college announcements","exam schedule","college updates"],
    openGraph: {
        title: 'Notices & Announcements | LDM College',
        description: 'Stay updated with the latest notices, exam schedules, and announcements from LDM College.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
