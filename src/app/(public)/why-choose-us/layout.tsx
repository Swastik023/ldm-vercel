import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Why Choose Us',
    description: 'Discover why LDM College of Pharmacy is the right choice — experienced faculty, modern facilities, placement support, and industry connections.',
    keywords: ["why choose LDM college","best pharmacy college","pharmacy placement","pharmacy college advantages"],
    openGraph: {
        title: 'Why Choose Us | LDM College of Pharmacy',
        description: 'Discover why LDM College of Pharmacy is the right choice — experienced faculty, modern facilities, placement support, and industry connections.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
