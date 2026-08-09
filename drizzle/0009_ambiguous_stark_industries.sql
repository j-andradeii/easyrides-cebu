CREATE TYPE "public"."credit_status" AS ENUM('available', 'applied', 'redeemed', 'expired', 'void');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_description" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"banner_image" text NOT NULL,
	"cta_label" text DEFAULT 'Send Inquiry' NOT NULL,
	"service_type" text,
	"vehicle_type" text,
	"is_published" boolean DEFAULT true NOT NULL,
	"ends_at" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"referral_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"currency" text DEFAULT 'PHP' NOT NULL,
	"status" "credit_status" DEFAULT 'available' NOT NULL,
	"reason" text NOT NULL,
	"quote_id" uuid,
	"expires_at" timestamp with time zone,
	"applied_at" timestamp with time zone,
	"redeemed_at" timestamp with time zone,
	"issued_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inquiries" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_credits" ADD CONSTRAINT "referral_credits_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_credits" ADD CONSTRAINT "referral_credits_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_credits" ADD CONSTRAINT "referral_credits_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_credits" ADD CONSTRAINT "referral_credits_issued_by_admin_users_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_uidx" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "campaigns_published_idx" ON "campaigns" USING btree ("is_published","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "referral_credits_contact_idx" ON "referral_credits" USING btree ("contact_id","status");--> statement-breakpoint
CREATE INDEX "referral_credits_quote_idx" ON "referral_credits" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_credits_referral_uidx" ON "referral_credits" USING btree ("referral_id") WHERE "referral_credits"."referral_id" is not null;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "inquiries_campaign_idx" ON "inquiries" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "opportunities_campaign_idx" ON "opportunities" USING btree ("campaign_id");