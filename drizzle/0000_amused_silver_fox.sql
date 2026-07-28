CREATE TYPE "public"."activity_type" AS ENUM('note', 'stage_change', 'message_out', 'message_in', 'call', 'email', 'task_created', 'task_completed', 'workflow', 'system');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('owner', 'admin', 'agent');--> statement-breakpoint
CREATE TYPE "public"."enrollment_status" AS ENUM('active', 'paused', 'completed', 'exited', 'failed');--> statement-breakpoint
CREATE TYPE "public"."opp_status" AS ENUM('open', 'won', 'lost', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'clicked', 'signed_up', 'booked', 'rewarded', 'void');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'done', 'cancelled');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid,
	"contact_id" uuid,
	"admin_user_id" uuid,
	"type" "activity_type" NOT NULL,
	"channel" text,
	"subject" text,
	"body" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" "admin_role" DEFAULT 'agent' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"country_code" text DEFAULT '+63',
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"lifetime_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"first_source" text,
	"notes" text,
	"referral_code" text,
	"referred_by_contact_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"source" text NOT NULL,
	"service_type" text,
	"vehicle_type" text,
	"preferred_date" date,
	"add_driver" boolean DEFAULT false NOT NULL,
	"message" text,
	"tour_title" text,
	"raw_payload" jsonb NOT NULL,
	"utm" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opportunities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"stage_id" uuid NOT NULL,
	"owner_id" uuid,
	"title" text NOT NULL,
	"status" "opp_status" DEFAULT 'open' NOT NULL,
	"service_type" text,
	"vehicle_type" text,
	"monetary_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'PHP' NOT NULL,
	"preferred_date" date,
	"source" text,
	"lost_reason" text,
	"expected_close_date" date,
	"won_at" timestamp with time zone,
	"lost_at" timestamp with time zone,
	"stage_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pipeline_id" uuid NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"sort_order" integer NOT NULL,
	"probability" integer DEFAULT 0 NOT NULL,
	"is_won" boolean DEFAULT false NOT NULL,
	"is_lost" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipelines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_contact_id" uuid NOT NULL,
	"referee_contact_id" uuid,
	"referee_opportunity_id" uuid,
	"code" text NOT NULL,
	"channel" text,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"referrer_reward" text,
	"referee_reward" text,
	"reward_paid_at" timestamp with time zone,
	"abuse_flag" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"converted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"opportunity_id" uuid,
	"rating" integer,
	"nps" integer,
	"comment" text,
	"is_promoter" boolean,
	"left_public" boolean DEFAULT false NOT NULL,
	"public_channel" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"token" text NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opportunity_id" uuid,
	"contact_id" uuid,
	"assigned_to" uuid,
	"title" text NOT NULL,
	"due_at" timestamp with time zone,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"opportunity_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" "enrollment_status" DEFAULT 'active' NOT NULL,
	"current_step" integer DEFAULT 0 NOT NULL,
	"next_run_at" timestamp with time zone,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"trigger_type" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"definition" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_admin_user_id_admin_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_referred_by_contact_id_contacts_id_fk" FOREIGN KEY ("referred_by_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opportunities" ADD CONSTRAINT "opportunities_owner_id_admin_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ADD CONSTRAINT "pipeline_stages_pipeline_id_pipelines_id_fk" FOREIGN KEY ("pipeline_id") REFERENCES "public"."pipelines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_contact_id_contacts_id_fk" FOREIGN KEY ("referrer_contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_contact_id_contacts_id_fk" FOREIGN KEY ("referee_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_opportunity_id_opportunities_id_fk" FOREIGN KEY ("referee_opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_admin_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_enrollments" ADD CONSTRAINT "workflow_enrollments_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_enrollments" ADD CONSTRAINT "workflow_enrollments_opportunity_id_opportunities_id_fk" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_enrollments" ADD CONSTRAINT "workflow_enrollments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_opp_idx" ON "activities" USING btree ("opportunity_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "admin_users_email_uidx" ON "admin_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_phone_uidx" ON "contacts" USING btree ("phone") WHERE "contacts"."phone" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_referral_code_uidx" ON "contacts" USING btree ("referral_code") WHERE "contacts"."referral_code" is not null;--> statement-breakpoint
CREATE INDEX "contacts_email_idx" ON "contacts" USING btree ("email");--> statement-breakpoint
CREATE INDEX "inquiries_created_idx" ON "inquiries" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "inquiries_source_idx" ON "inquiries" USING btree ("source");--> statement-breakpoint
CREATE INDEX "inquiries_opportunity_idx" ON "inquiries" USING btree ("opportunity_id");--> statement-breakpoint
CREATE INDEX "opportunities_stage_idx" ON "opportunities" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "opportunities_status_idx" ON "opportunities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "opportunities_owner_idx" ON "opportunities" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "opportunities_created_idx" ON "opportunities" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "pipeline_stages_pipeline_key_uidx" ON "pipeline_stages" USING btree ("pipeline_id","key");--> statement-breakpoint
CREATE INDEX "referrals_referrer_idx" ON "referrals" USING btree ("referrer_contact_id");--> statement-breakpoint
CREATE INDEX "referrals_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "referrals_code_idx" ON "referrals" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_token_uidx" ON "reviews" USING btree ("token");--> statement-breakpoint
CREATE INDEX "reviews_contact_idx" ON "reviews" USING btree ("contact_id");--> statement-breakpoint
CREATE INDEX "reviews_published_idx" ON "reviews" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "tasks_due_idx" ON "tasks" USING btree ("assigned_to","status","due_at");--> statement-breakpoint
CREATE INDEX "enrollments_due_idx" ON "workflow_enrollments" USING btree ("status","next_run_at");--> statement-breakpoint
CREATE INDEX "enrollments_opp_idx" ON "workflow_enrollments" USING btree ("opportunity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workflows_key_uidx" ON "workflows" USING btree ("key");