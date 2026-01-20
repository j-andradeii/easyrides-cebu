# Next.js SEO Guide: Ranking on Google's First Page

## Table of Contents
1. [Technical SEO Fundamentals](#1-technical-seo-fundamentals)
2. [Keyword Strategy](#2-keyword-strategy)
3. [On-Page SEO](#3-on-page-seo)
4. [Structured Data (JSON-LD)](#4-structured-data-json-ld)
5. [Performance & Core Web Vitals](#5-performance--core-web-vitals)
6. [Local SEO](#6-local-seo)
7. [Content Strategy](#7-content-strategy)
8. [Monitoring & Iteration](#8-monitoring--iteration)

---

## 1. Technical SEO Fundamentals

### Metadata Configuration (Root Layout)

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL("https://yourdomain.com"),

  // Primary title - 50-60 characters max
  title: {
    default: "Brand Name - Primary Service | Location",
    template: "%s | Brand Name", // For child pages
  },

  // Description - 150-160 characters, include call-to-action
  description: "Clear value proposition with primary keyword. Include location if local business. End with CTA.",

  // Keywords (lower impact but still useful)
  keywords: ["primary keyword", "secondary keyword", "long-tail keyword"],

  // Canonical URL prevents duplicate content
  alternates: {
    canonical: "/",
  },

  // Open Graph for social sharing
  openGraph: {
    title: "Same or similar to page title",
    description: "Can be slightly different, optimized for social",
    url: "https://yourdomain.com",
    siteName: "Brand Name",
    images: [
      {
        url: "/og-image.jpg", // 1200x630px recommended
        width: 1200,
        height: 630,
        alt: "Descriptive alt text with keyword",
      },
    ],
    type: "website",
    locale: "en_US",
  },

  // Twitter Cards
  twitter: {
    card: "summary_large_image",
    title: "Same as OG title",
    description: "Same as OG description",
    images: ["/og-image.jpg"],
  },

  // Google Search Console verification
  verification: {
    google: "your-verification-code",
  },

  // Robots directives
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
```

### Sitemap Configuration

```tsx
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://yourdomain.com';

  // Fetch dynamic content
  const products = await getProducts();
  const blogPosts = await getBlogPosts();

  // Static routes
  const staticRoutes = [
    { url: baseUrl, priority: 1.0, changeFrequency: 'daily' },
    { url: `${baseUrl}/about`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${baseUrl}/services`, priority: 0.9, changeFrequency: 'weekly' },
    { url: `${baseUrl}/contact`, priority: 0.7, changeFrequency: 'monthly' },
  ];

  // Dynamic routes with actual last modified dates
  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updatedAt, // Use actual dates!
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...productRoutes];
}
```

### Robots.txt Configuration

```tsx
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/', '/private/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
    ],
    sitemap: 'https://yourdomain.com/sitemap.xml',
    host: 'https://yourdomain.com',
  };
}
```

---

## 2. Keyword Strategy

### Keyword Research Process

1. **Identify Seed Keywords**
   - Core services/products you offer
   - Problems you solve
   - Location (for local businesses)

2. **Expand with Long-Tail Keywords**
   ```
   Seed: "car rental cebu"
   Long-tail variations:
   - "affordable car rental cebu with driver"
   - "cebu airport car rental service"
   - "self-drive car rental cebu rates"
   - "best car rental for cebu tour"
   ```

3. **Analyze Search Intent**
   | Intent | Example Keywords | Content Type |
   |--------|-----------------|--------------|
   | Informational | "best places to visit cebu" | Blog post |
   | Commercial | "cebu tour package prices" | Comparison page |
   | Transactional | "book cebu south tour" | Service/Product page |
   | Navigational | "easyridecebu contact" | About/Contact page |

### Keyword Placement Priority (Most to Least Important)

```
1. URL slug           → /cebu-south-tour-package
2. Title tag (H1)     → "Cebu South Tour Package - Full Day Adventure"
3. Meta description   → Include primary + secondary keywords naturally
4. First paragraph    → Mention primary keyword within first 100 words
5. Subheadings (H2-H3)→ Use variations and related keywords
6. Image alt text     → Descriptive with keyword where natural
7. Internal links     → Use keyword-rich anchor text
8. Body content       → Natural usage, avoid keyword stuffing
```

### Optimal Keyword Density

- **Target**: 1-2% keyword density (1-2 mentions per 100 words)
- **Rule**: If it sounds unnatural, remove it
- **Use LSI keywords**: Related terms Google associates with your topic

### Dynamic Page Metadata Example

```tsx
// src/app/tours/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tour = await getTour(params.slug);

  // Craft keyword-rich but natural title (50-60 chars)
  const title = `${tour.title} | Cebu Tour Package | EasyRideCebu`;

  // Include keywords naturally in description (150-160 chars)
  const description = `Book ${tour.title} in Cebu. ${tour.duration} tour includes ${tour.highlights.slice(0,2).join(', ')}. Starting at ₱${tour.price}. Easy online booking!`;

  return {
    title,
    description,
    keywords: [
      tour.title.toLowerCase(),
      `${tour.location} tour`,
      `cebu ${tour.category} tour`,
      'cebu tour package',
      'cebu day tour',
      ...tour.destinations.map(d => `${d} tour`),
    ],
    openGraph: {
      title,
      description,
      url: `https://yourdomain.com/tours/${tour.slug}`,
      images: [{ url: tour.image, alt: tour.title }],
    },
    alternates: {
      canonical: `https://yourdomain.com/tours/${tour.slug}`,
    },
  };
}
```

---

## 3. On-Page SEO

### URL Structure Best Practices

```
Good:
/tours/cebu-south-tour
/car-rental/sedan
/blog/best-beaches-cebu

Bad:
/tours/123
/page?id=456
/car-rental/sedan-car-rental-cebu-affordable-cheap
```

### Heading Hierarchy

```tsx
<main>
  <h1>Primary Keyword - One per page</h1>

  <section>
    <h2>Secondary Keyword Variation</h2>
    <p>Content with natural keyword usage...</p>

    <h3>Supporting Topic</h3>
    <p>More detailed content...</p>
  </section>

  <section>
    <h2>Another Related Topic</h2>
    ...
  </section>
</main>
```

### Image Optimization

```tsx
import Image from 'next/image';

<Image
  src="/tours/cebu-south-tour.webp"  // Use WebP format
  alt="Cebu South Tour - Kawasan Falls swimming area" // Descriptive alt
  width={1200}
  height={630}
  priority={isAboveFold}  // Priority for LCP images
  loading={isAboveFold ? undefined : "lazy"}
/>
```

### Internal Linking Strategy

```tsx
// Use descriptive anchor text
<Link href="/tours/cebu-south-tour">
  Cebu South Tour Package  // Good: descriptive
</Link>

// Avoid generic text
<Link href="/tours/cebu-south-tour">
  Click here  // Bad: not descriptive
</Link>
```

---

## 4. Structured Data (JSON-LD)

### Local Business Schema (Essential for Local SEO)

```tsx
// In your layout.tsx or page component
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://yourdomain.com/#business",
  "name": "EasyRideCebu",
  "image": "https://yourdomain.com/logo.jpg",
  "url": "https://yourdomain.com",
  "telephone": "+639178046988",
  "email": "info@yourdomain.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Your Street Address",
    "addressLocality": "Cebu City",
    "addressRegion": "Cebu",
    "postalCode": "6000",
    "addressCountry": "PH"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 10.3157,
    "longitude": 123.8854
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "20:00"
    }
  ],
  "priceRange": "$$",
  "areaServed": {
    "@type": "City",
    "name": "Cebu City"
  },
  "sameAs": [
    "https://facebook.com/yourpage",
    "https://instagram.com/yourpage"
  ]
};
```

### Product/Service Schema

```tsx
const tourSchema = {
  "@context": "https://schema.org",
  "@type": "TouristTrip",
  "name": "Cebu South Tour",
  "description": "Full day tour to South Cebu attractions...",
  "touristType": "Adventure travelers",
  "itinerary": {
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "TouristAttraction",
          "name": "Kawasan Falls"
        }
      }
    ]
  },
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "3500",
    "highPrice": "7000",
    "priceCurrency": "PHP",
    "availability": "https://schema.org/InStock"
  },
  "provider": {
    "@type": "LocalBusiness",
    "name": "EasyRideCebu"
  }
};
```

### FAQ Schema (Boosts Click-Through Rate)

```tsx
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does a Cebu South Tour cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Cebu South Tour packages start from ₱3,500 for sedan (up to 4 pax) to ₱7,000 for van (up to 10 pax), including driver, fuel, and vehicle."
      }
    },
    {
      "@type": "Question",
      "name": "What is included in the tour?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "All tours include air-conditioned vehicle, professional driver/guide, fuel, parking fees, and hotel pickup/dropoff."
      }
    }
  ]
};
```

### Breadcrumb Schema

```tsx
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://yourdomain.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Tours",
      "item": "https://yourdomain.com/tours"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Cebu South Tour",
      "item": "https://yourdomain.com/tours/cebu-south-tour"
    }
  ]
};
```

---

## 5. Performance & Core Web Vitals

Google uses Core Web Vitals as ranking factors:

### LCP (Largest Contentful Paint) - Target: < 2.5s

```tsx
// Preload critical images
<head>
  <link rel="preload" as="image" href="/hero-image.webp" />
</head>

// Use priority for above-fold images
<Image src="/hero.webp" priority alt="..." />

// Use next/font for fonts
const font = Inter({ subsets: ['latin'], display: 'swap' });
```

### CLS (Cumulative Layout Shift) - Target: < 0.1

```tsx
// Always specify image dimensions
<Image src="/image.webp" width={800} height={600} alt="..." />

// Reserve space for dynamic content
<div className="min-h-[400px]">
  {isLoading ? <Skeleton /> : <Content />}
</div>
```

### FID/INP (Interaction Responsiveness) - Target: < 200ms

```tsx
// Use dynamic imports for heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false,
});

// Defer non-critical JavaScript
<Script src="/analytics.js" strategy="lazyOnload" />
```

### Next.js Performance Config

```tsx
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Enable compression
  compress: true,

  // Optimize packages
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
};
```

---

## 6. Local SEO

### Google Business Profile Integration

1. **Claim and verify** your Google Business Profile
2. **NAP Consistency**: Name, Address, Phone must match everywhere
3. **Add all services** with descriptions
4. **Upload quality photos** regularly
5. **Respond to reviews** promptly
6. **Post updates** weekly

### Local Keywords Strategy

```
Format: [Service] + [Location] + [Modifier]

Examples:
- "car rental cebu city"
- "affordable cebu tour package"
- "airport transfer mactan cebu"
- "best south cebu tour"
- "cebu tour with driver"
```

### Local Schema Enhancement

```tsx
const localSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "EasyRideCebu",
  "areaServed": [
    { "@type": "City", "name": "Cebu City" },
    { "@type": "City", "name": "Mandaue" },
    { "@type": "City", "name": "Lapu-Lapu" },
    { "@type": "AdministrativeArea", "name": "Cebu Province" }
  ],
  "serviceArea": {
    "@type": "GeoCircle",
    "geoMidpoint": {
      "@type": "GeoCoordinates",
      "latitude": 10.3157,
      "longitude": 123.8854
    },
    "geoRadius": "100000" // 100km radius
  },
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Cebu South Tour",
          "serviceType": "Tour Package"
        }
      }
    ]
  }
};
```

---

## 7. Content Strategy

### Blog/Content Hub for Organic Traffic

Create content targeting informational keywords:

```
/blog/best-beaches-cebu              → "best beaches in cebu"
/blog/cebu-travel-guide              → "cebu travel guide 2024"
/blog/kawasan-falls-how-to-get-there → "kawasan falls directions"
/blog/cebu-south-tour-itinerary      → "what to do cebu south"
```

### Content Structure for SEO

```tsx
// Blog post page structure
export default function BlogPost() {
  return (
    <article>
      {/* Schema for article */}
      <script type="application/ld+json">
        {JSON.stringify(articleSchema)}
      </script>

      <header>
        <h1>Primary Keyword in Title</h1>
        <p className="lead">Introduction with keyword in first 100 words</p>
        <time dateTime="2024-01-15">Published: January 15, 2024</time>
      </header>

      <TableOfContents /> {/* Improves UX and time on page */}

      <section>
        <h2>Keyword Variation in Subheading</h2>
        <p>Valuable, comprehensive content...</p>

        <h3>Supporting Topic</h3>
        <p>More detail with natural keyword usage...</p>
      </section>

      <section>
        <h2>Related Topic</h2>
        {/* Internal links to related content */}
        <Link href="/tours/cebu-south-tour">Book a Cebu South Tour</Link>
      </section>

      <FAQ items={faqs} /> {/* FAQ section with schema */}
    </article>
  );
}
```

---

## 8. Monitoring & Iteration

### Essential Tools

1. **Google Search Console** (Free)
   - Monitor indexing status
   - Track keyword rankings
   - Identify crawl errors
   - Submit sitemaps

2. **Google Analytics 4** (Free)
   - Track organic traffic
   - Monitor user behavior
   - Identify top landing pages

3. **PageSpeed Insights** (Free)
   - Core Web Vitals scores
   - Performance recommendations

### Weekly SEO Checklist

- [ ] Check Search Console for errors
- [ ] Monitor Core Web Vitals
- [ ] Review top performing pages
- [ ] Check for broken links
- [ ] Update outdated content
- [ ] Respond to new reviews

### Monthly SEO Tasks

- [ ] Analyze keyword rankings
- [ ] Review competitor changes
- [ ] Update sitemap if needed
- [ ] Publish new content
- [ ] Build internal links
- [ ] Check mobile usability

---

## Quick Wins Checklist

### Immediate Actions
- [ ] Verify Google Search Console ownership
- [ ] Submit sitemap to Search Console
- [ ] Claim Google Business Profile
- [ ] Add JSON-LD structured data
- [ ] Optimize title tags (50-60 chars)
- [ ] Write compelling meta descriptions (150-160 chars)
- [ ] Add alt text to all images
- [ ] Ensure mobile responsiveness
- [ ] Enable HTTPS
- [ ] Fix broken links

### Technical Improvements
- [ ] Implement canonical URLs
- [ ] Configure robots.txt properly
- [ ] Optimize Core Web Vitals
- [ ] Use semantic HTML (header, main, article, section)
- [ ] Implement breadcrumbs with schema
- [ ] Add FAQ schema where applicable

### Content Optimization
- [ ] Research and target long-tail keywords
- [ ] Create location-specific landing pages
- [ ] Add internal links between related content
- [ ] Update content with current year/dates
- [ ] Create valuable blog content

---

## Tools & Resources

### Keyword Research
- Google Keyword Planner (Free)
- Ubersuggest (Freemium)
- AnswerThePublic (Free)
- Google Trends (Free)
- Ahrefs/SEMrush (Paid)

### Technical SEO
- [Google Search Console](https://search.google.com/search-console)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Markup Validator](https://validator.schema.org/)

### Content
- [Google Trends](https://trends.google.com)
- [AnswerThePublic](https://answerthepublic.com)
- [AlsoAsked](https://alsoasked.com)

---

## Summary: Google Ranking Formula

```
Rankings =
  (Relevant Content + Proper Keywords)
  × Technical SEO
  × Page Experience
  × Authority (Backlinks)
  × User Engagement
```

Focus on:
1. **Content Quality**: Answer user intent comprehensively
2. **Technical Foundation**: Fast, crawlable, mobile-friendly
3. **On-Page Optimization**: Keywords in right places
4. **Structured Data**: Help Google understand your content
5. **Local Signals**: Google Business Profile + Local keywords
6. **Consistency**: Regular updates and fresh content
