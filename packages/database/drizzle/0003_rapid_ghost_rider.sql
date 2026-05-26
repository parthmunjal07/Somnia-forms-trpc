ALTER TABLE "users" ADD COLUMN "is_suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "page_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "fields" ADD COLUMN "conditional_logic" jsonb;