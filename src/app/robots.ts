import type { MetadataRoute } from 'next'

/**
 * Paths no crawler should index.
 *
 * `/quote/`, `/review/` and `/r/` are private tokenized customer links — they
 * are shared by message only, and the token in the URL is the authentication.
 */
const DISALLOW = [
    '/api/',
    '/admin/',
    '/dashboard/',
    '/auth-module/',
    '/private/',
    '/quote/',
    '/review/',
    '/r/',
]

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: DISALLOW,
            },
            {
                // A named group replaces the `*` group outright for that crawler,
                // so Googlebot needs its own copy of the disallow list.
                userAgent: 'Googlebot',
                allow: '/',
                disallow: DISALLOW,
            },
        ],
        sitemap: 'https://www.easyridecebutours.com/sitemap.xml',
        host: 'https://www.easyridecebutours.com',
    }
}
