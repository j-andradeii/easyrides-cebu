CREATE TYPE "public"."quote_type" AS ENUM('full_payment', 'partial_payment');--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "quote_type" "quote_type" DEFAULT 'full_payment' NOT NULL;