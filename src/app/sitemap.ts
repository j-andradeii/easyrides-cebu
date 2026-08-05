import { MetadataRoute } from 'next';
import { getPublishedTours } from '@/lib/tours/repository';

/**
 * Built on every request, not at deploy time.
 *
 * A sitemap has no revalidation timer of its own: generated during `next build`
 * it is written once and frozen, so on a build box with no database credentials
 * it shipped with zero tour URLs and stayed that way until the next deploy —
 * which is exactly what production was serving. Crawler traffic is a handful of
 * hits a day, so a query per request costs nothing.
 */
export const dynamic = 'force-dynamic';

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
