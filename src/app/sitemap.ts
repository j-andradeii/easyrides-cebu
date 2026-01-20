import { MetadataRoute } from 'next';
import toursData from '@/data/tours.json';
import { Tour } from '@/types/tour';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.easyridecebutours.com';

    // Static routes with SEO priorities
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/tours`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        },
    ];

    // Dynamic tour routes - high priority for product/service pages
    const tours = toursData.tours as Tour[];

    // Featured tours get higher priority
    const tourRoutes: MetadataRoute.Sitemap = tours.map((tour) => ({
        url: `${baseUrl}/tours/${tour.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: tour.featured ? 0.9 : 0.8,
    }));

    // Section anchors for internal linking (these help with crawlability)
    const sectionRoutes: MetadataRoute.Sitemap = [
        {
            url: `${baseUrl}/#services`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/#fleet`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
        {
            url: `${baseUrl}/#contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.6,
        },
    ];

    return [...staticRoutes, ...tourRoutes, ...sectionRoutes];
}
