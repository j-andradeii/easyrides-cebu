ALTER TABLE "inquiries" ADD COLUMN "pickup_location" text;--> statement-breakpoint
ALTER TABLE "vehicles" ADD COLUMN "gallery" text[] DEFAULT '{}'::text[] NOT NULL;