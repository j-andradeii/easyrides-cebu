/**
 * Tour Type Definitions
 *
 * `Tour` is the shape the public site renders — it is unchanged from the days
 * when the catalogue lived in `src/data/tours.json`, so every landing/tour
 * component kept working when the data moved into Postgres.
 *
 * `TourRecord` adds the columns only the portal cares about (id, publish state,
 * ordering, audit stamps).
 */

export interface TourPricing {
  price: number;
  capacity: string;
}

export interface TourPricingOptions {
  sedan: TourPricing;
  suv: TourPricing;
  van: TourPricing;
}

export interface ItineraryItem {
  time?: string;
  activity: string;
}

export interface Tour {
  slug: string;
  title: string;
  shortDescription: string;
  /** Sanitised HTML from the portal's rich-text editor. */
  description: string;
  image: string;
  gallery?: string[];
  duration: string;
  featured: boolean;
  pricing: TourPricingOptions;
  itinerary: ItineraryItem[];
  inclusions: string[];
  exclusions: string[];
}

/** A tour as the admin portal sees it. */
export interface TourRecord extends Tour {
  id: string;
  gallery: string[];
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  updatedByName: string | null;
}

/** One row of the /admin/tours table — no long-form fields. */
export interface TourListItem {
  id: string;
  slug: string;
  title: string;
  image: string;
  duration: string;
  featured: boolean;
  isPublished: boolean;
  sortOrder: number;
  /** Cheapest of the three vehicle rates, for the "from ₱x" column. */
  fromPrice: number;
  itineraryCount: number;
  galleryCount: number;
  updatedAt: string;
}

export interface ToursData {
  tours: Tour[];
}
