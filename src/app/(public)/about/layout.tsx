import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'Learn about LDM College — our history, vision, infrastructure, and commitment to pharmaceutical education excellence.',
    keywords: ["about LDM pharmacy college","LDM college history","pharmacy college about"],
    openGraph: {
        title: 'About Us | LDM College',
        description: 'Learn about LDM College — our history, vision, infrastructure, and commitment to pharmaceutical education excellence.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
