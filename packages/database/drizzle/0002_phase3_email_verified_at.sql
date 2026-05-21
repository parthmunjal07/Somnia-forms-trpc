ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified";
--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "theme" varchar(50) DEFAULT 'classic-dark' NOT NULL;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "response_limit" integer;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "password_hash" varchar(255);--> statement-breakpoint
ALTER TABLE "forms" ADD COLUMN "thank_you_message" text;
