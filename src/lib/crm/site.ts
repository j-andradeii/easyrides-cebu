/**
 * The public base URL, used to build absolute links in emails and QR targets.
 *
 * Its own module so link builders don't have to import the whole repository
 * layer just to know where the site lives.
 */

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
