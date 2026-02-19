import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ldm.edu.in';

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
        { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
        { url: `${BASE_URL}/courses`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
        { url: `${BASE_URL}/facilities`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
        { url: `${BASE_URL}/gallery`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
        { url: `${BASE_URL}/notices`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
        { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
        { url: `${BASE_URL}/team`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/mission`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/why-choose-us`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
        { url: `${BASE_URL}/collaborations`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/hospital`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/ayurvedic-pharma`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${BASE_URL}/vaid-saurabh`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    ];

    return staticRoutes;
}
