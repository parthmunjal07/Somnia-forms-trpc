CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro', 'team');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL;
