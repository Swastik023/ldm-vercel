import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Facilities',
    description: 'Discover world-class facilities at LDM College — modern labs, library, hospital, and more for an outstanding learning experience.',
    keywords: ["pharmacy college facilities","laboratory","pharmacy library","college infrastructure"],
    openGraph: {
        title: 'Facilities | LDM College',
        description: 'Discover world-class facilities at LDM College — modern labs, library, hospital, and more for an outstanding learning experience.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
