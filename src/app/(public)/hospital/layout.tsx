import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hospital & Clinical Training',
    description: 'LDM College of Pharmacy provides hands-on clinical training through its associated hospital, giving students real-world healthcare experience.',
    keywords: ["LDM hospital","pharmacy clinical training","hospital pharmacy","practical training"],
    openGraph: {
        title: 'Hospital & Clinical Training | LDM College of Pharmacy',
        description: 'LDM College of Pharmacy provides hands-on clinical training through its associated hospital, giving students real-world healthcare experience.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
