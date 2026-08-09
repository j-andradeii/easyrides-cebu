import { MetadataRoute } from 'next';
import { getPublishedCampaigns } from '@/lib/campaigns/repository';
import { getPublishedTours } from '@/lib/tours/repository';
import { getPublishedVehicles } from '@/lib/vehicles/repository';

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

    // One page per vehicle — "rent a sedan in Cebu" is its own search, and the
    // fleet changes far less often than the tours do.
    const vehicles = await getPublishedVehicles();

    const vehicleRoutes: MetadataRoute.Sitemap = vehicles.map((vehicle) => ({
        url: `${baseUrl}/fleet/${vehicle.slug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly' as const,
        priority: vehicle.popular ? 0.9 : 0.8,
    }));

    // Live promos only. An ended campaign keeps its page (an old post still
    // links to it) but is marked noindex, so listing it here would ask Google
    // to crawl something we have told it not to index.
    const campaigns = await getPublishedCampaigns();

    const campaignRoutes: MetadataRoute.Sitemap = campaigns
        .filter((campaign) => !campaign.hasEnded)
        .map((campaign) => ({
            url: `${baseUrl}/promo/${campaign.slug}`,
            // A promo changes right up until it is posted, and its life is
            // measured in weeks — worth a frequent recrawl while it runs.
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 0.7,
        }));

    return [...staticRoutes, ...tourRoutes, ...vehicleRoutes, ...campaignRoutes];
}
