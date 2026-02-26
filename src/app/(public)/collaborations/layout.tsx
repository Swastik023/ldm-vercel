import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Collaborations & Partnerships',
    description: 'LDM College partners with leading hospitals, pharmaceutical companies, and research institutions for student training and placements.',
    keywords: ["LDM collaborations","pharmacy college partnerships","hospital attachment","pharmaceutical industry"],
    openGraph: {
        title: 'Collaborations & Partnerships | LDM College',
        description: 'LDM College partners with leading hospitals, pharmaceutical companies, and research institutions for student training and placements.',
        type: 'website',
    },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
