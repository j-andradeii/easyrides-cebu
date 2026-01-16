import { MetadataRoute } from 'next';
import toursData from '@/data/tours.json';
import { Tour } from '@/types/tour';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://www.easyridecebutours.com';

    // Static routes
    const routes = [
        '',
        '/tours',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic tour routes
    const tours = toursData.tours as Tour[];
    const tourRoutes = tours.map((tour) => ({
        url: `${baseUrl}/tours/${tour.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9, // High priority for product pages
    }));

    return [...routes, ...tourRoutes];
}
