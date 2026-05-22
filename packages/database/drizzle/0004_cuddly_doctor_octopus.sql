CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'team');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "validation_rules" jsonb;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "theme" varchar(50) DEFAULT 'classic-dark' NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "response_limit" integer;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "thank_you_message" text;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "redirect_url" text;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email_verified";