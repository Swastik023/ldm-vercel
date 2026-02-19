import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Mission & Vision',
    description: 'Discover the mission, vision, and core values of LDM College of Pharmacy — building the next generation of pharmacy professionals.',
    keywords: ["LDM mission","pharmacy college vision","college values","educational mission"],
    openGraph: {
        title: 'Mission & Vision | LDM College of Pharmacy',
        description: 'Discover the mission, vision, and core values of LDM College of Pharmacy — building the next generation of pharmacy professionals.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
