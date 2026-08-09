/**
 * Campaign Type Definitions
 *
 * `Campaign` is what /promo/[slug] renders and what `generateMetadata` builds
 * the link preview from — nothing internal, because this shape is handed to a
 * public page.
 *
 * `CampaignRecord` adds what the portal needs (id, publish state, audit stamps,
 * the two counters), and `CampaignListItem` is one row of /admin/campaigns —
 * the same three-shape split `types/vehicle.ts` uses.
 */

export interface Campaign {
  /** URL segment — the promo lives at /promo/[slug]. */
  slug: string;
  name: string;
  /** Plain text. The og:description and the line under the heading. */
  shortDescription: string;
  /** Sanitised HTML from the portal's rich-text editor. */
  description: string;
  /** The og:image and the page's hero. */
  bannerImage: string;
  ctaLabel: string;
  /** Pre-selects the form's service dropdown. */
  serviceType: string | null;
  vehicleType: string | null;
  /** ISO string, or null when the offer never lapses. */
  endsAt: string | null;
  /**
   * Server-computed so the page never has to trust the visitor's clock — the
   * same reason `PublicQuote.isExpired` exists.
   */
  hasEnded: boolean;
}

/** A campaign as the admin portal sees it. */
export interface CampaignRecord extends Campaign {
  id: string;
  isPublished: boolean;
  viewCount: number;
  /** Opportunities attributed to this campaign. */
  leadCount: number;
  createdAt: string;
  updatedAt: string;
  updatedByName: string | null;
}

/** One row of the /admin/campaigns table. */
export interface CampaignListItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  bannerImage: string;
  isPublished: boolean;
  endsAt: string | null;
  hasEnded: boolean;
  viewCount: number;
  leadCount: number;
  /** Leads from this campaign whose deal reached a won stage. */
  bookedCount: number;
  createdAt: string;
  updatedAt: string;
}
