import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gallery',
    description: 'Browse the LDM College of Pharmacy photo gallery — campus life, events, laboratories, and student activities.',
    keywords: ["LDM college gallery","pharmacy college campus","college events"],
    openGraph: {
        title: 'Gallery | LDM College of Pharmacy',
        description: 'Browse the LDM College of Pharmacy photo gallery — campus life, events, laboratories, and student activities.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
