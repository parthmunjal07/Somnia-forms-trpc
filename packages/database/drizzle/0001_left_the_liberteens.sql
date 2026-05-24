CREATE TYPE "public"."theme" AS ENUM('inception', 'dark_knight', 'interstellar', 'tenet');--> statement-breakpoint
UPDATE "forms" SET "theme" = 'inception';--> statement-breakpoint
ALTER TABLE "forms" ALTER COLUMN "theme" SET DEFAULT 'inception'::"public"."theme";--> statement-breakpoint
ALTER TABLE "forms" ALTER COLUMN "theme" SET DATA TYPE "public"."theme" USING "theme"::"public"."theme";