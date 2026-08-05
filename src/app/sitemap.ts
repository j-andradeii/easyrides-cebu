import { MetadataRoute } from 'next';
import { getPublishedTours } from '@/lib/tours/repository';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

    // Dynamic tour routes - high priority for product/service pages.
    // Published tours only: an unpublished tour has no page to point Google at.
    const tours = await getPublishedTours();

    // Featured tours get higher priority
    const tourRoutes: MetadataRoute.Sitemap = tours.map((tour) => ({
        url: `${baseUrl}/tours/${tour.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: tour.featured ? 0.9 : 0.8,
    }));

    return [...staticRoutes, ...tourRoutes];
}
