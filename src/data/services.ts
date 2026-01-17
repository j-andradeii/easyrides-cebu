export interface ServiceData {
    id: string;
    title: string;
    shortTitle: string;
    description: string;
    image: string;
    features: string[];
    color: 'orange' | 'cyan' | 'emerald' | 'violet' | 'rose';
    link: string;
}

export const servicesData: ServiceData[] = [
    {
        id: 'car-rentals',
        title: 'Car Rentals',
        shortTitle: 'Car Rentals',
        description:
            'Experience the freedom of the road. From the majestic CCLEX to the scenic mountain views of Tops, our fleet is ready for your adventure.',
        image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/destinator.jpg',
        features: ['Unlimited mileage option', 'Comprehensive Insurance', '24/7 Roadside support'],
        color: 'orange',
        link: '/#fleet',
    },
    {
        id: 'airport-transfers',
        title: 'Airport Transfers',
        shortTitle: 'Transfers',
        description:
            'Start your trip stress-free with our premium airport transfer service. We monitor your flight and ensure a smooth pickup.',
        image: 'https://s28477.pcdn.co/wp-content/uploads/2018/05/CEB_2A-984x554.jpg',
        features: ['Flight tracking', 'Meet & greet service', 'Fixed competitive rates'],
        color: 'cyan',
        link: '/#contact',
    },
    {
        id: 'tour-packages',
        title: 'Tour Packages',
        shortTitle: 'Tours',
        description:
            "From waterfalls to heritage sites, discover the best of Cebu with our curated tour packages designed for every type of traveler.",
        image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/tours/oslob.avif',
        features: ['1D to 5D4N packages', 'Expert local guides', 'All-inclusive options'],
        color: 'emerald',
        link: '/tours',
    },
    {
        id: 'custom-itinerary',
        title: 'Custom Itinerary',
        shortTitle: 'Custom',
        description:
            'Your trip, your way. Our travel experts help you design a personalized itinerary that fits your specific preferences and budget.',
        image: 'https://djuny0idasckxayv.public.blob.vercel-storage.com/tours/city_tour.png',
        features: ['Flexible scheduling', 'Personalized routes', 'Budget-friendly planning'],
        color: 'violet',
        link: '/#contact',
    },
    {
        id: 'city-transport',
        title: 'City Transport',
        shortTitle: 'Transport',
        description:
            'Safe, reliable, and convenient transport for business meetings, events, or simply getting around Cebu City and Mandaue.',
        image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80',
        features: ['Business class vehicles', 'Professional chauffeurs', 'Hourly bookings'],
        color: 'rose',
        link: '/#contact',
    },
];
