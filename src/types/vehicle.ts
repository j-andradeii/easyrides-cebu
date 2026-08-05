/**
 * Vehicle Type Definitions
 *
 * `Vehicle` is the shape the landing page's fleet section renders — field for
 * field the array that used to sit at the top of `FleetSection.tsx`, so the
 * card markup kept working when the fleet moved into Postgres.
 *
 * `VehicleRecord` adds the columns only the portal cares about (id, publish
 * state, ordering, audit stamps), exactly as `TourRecord` does for tours.
 */

export interface Vehicle {
  /** The card heading — "Sedan", "SUV", "Van". */
  type: string;
  /** The cars in that class — "Vios / Mirage G4 (AT)". */
  models: string;
  capacity: string;
  /** Whole pesos for 24 hours. */
  rate: number;
  features: string[];
  image: string;
  /** Draws the "MOST POPULAR" ribbon on the card. */
  popular: boolean;
}

/** A vehicle as the admin portal sees it. */
export interface VehicleRecord extends Vehicle {
  id: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  updatedByName: string | null;
}

/** One row of the /admin/vehicles table. */
export interface VehicleListItem {
  id: string;
  type: string;
  models: string;
  capacity: string;
  rate: number;
  image: string;
  popular: boolean;
  isPublished: boolean;
  sortOrder: number;
  featureCount: number;
  updatedAt: string;
}
