ALTER TABLE "inquiries" ADD COLUMN "vehicle_name" text;--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "rental_days" integer;--> statement-breakpoint
--
-- vehicles.slug is NOT NULL UNIQUE, but the fleet already has rows — so it
-- arrives nullable, gets backfilled, and only then takes the constraints.
-- (drizzle-kit generates a bare `ADD COLUMN … NOT NULL`, which aborts on any
-- non-empty table. Hand-edited on purpose; regenerating this file will undo it.)
--
ALTER TABLE "vehicles" ADD COLUMN "slug" text;--> statement-breakpoint
--
-- Mirrors `slugify()` in src/lib/tours/slug.ts: "&" becomes "and", apostrophes
-- vanish, everything else non-alphanumeric collapses to a dash, 80 chars max.
-- Models lead the slug so /fleet/vios-mirage-g4-at-sedan reads as the car.
--
UPDATE "vehicles"
SET "slug" = trim(both '-' from left(
  trim(both '-' from regexp_replace(
    replace(replace(lower("models" || '-' || "type"), '&', ' and '), '''', ''),
    '[^a-z0-9]+', '-', 'g'
  )),
  80
))
WHERE "slug" IS NULL;--> statement-breakpoint
-- Two cars whose class and models slugify identically: keep the first eight
-- characters of the id so both rows survive the unique index below.
UPDATE "vehicles" v
SET "slug" = left(v."slug", 71) || '-' || substr(v."id"::text, 1, 8)
WHERE EXISTS (
  SELECT 1 FROM "vehicles" o WHERE o."slug" = v."slug" AND o."id" <> v."id"
);--> statement-breakpoint
-- Belt and braces: a row whose models and type held nothing sluggable.
UPDATE "vehicles"
SET "slug" = 'vehicle-' || substr("id"::text, 1, 8)
WHERE "slug" IS NULL OR "slug" = '';--> statement-breakpoint
ALTER TABLE "vehicles" ALTER COLUMN "slug" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicles_slug_uidx" ON "vehicles" USING btree ("slug");
