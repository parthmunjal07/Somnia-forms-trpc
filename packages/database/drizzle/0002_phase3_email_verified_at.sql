ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;
ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified";
