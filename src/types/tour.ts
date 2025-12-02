/**
 * Tour Type Definitions
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
  description: string;
  image: string;
  duration: string;
  featured: boolean;
  pricing: TourPricingOptions;
  itinerary: ItineraryItem[];
  inclusions: string[];
  exclusions: string[];
}

export interface ToursData {
  tours: Tour[];
}
