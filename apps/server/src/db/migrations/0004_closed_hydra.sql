ALTER TABLE "documents" ALTER COLUMN "document_type" SET DATA TYPE text;--> statement-breakpoint
UPDATE "documents" SET "document_type" = 'DEGREE_TRANSCRIPT' WHERE "document_type" IN ('ACADEMIC_TRANSCRIPT', 'GRADUATION_CERTIFICATE');--> statement-breakpoint
DROP TYPE "public"."document_type";--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('DEGREE_TRANSCRIPT', 'CV', 'SUBJECT_QUALIFICATION');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "document_type" SET DATA TYPE "public"."document_type" USING "document_type"::"public"."document_type";--> statement-breakpoint
ALTER TABLE "tutor_subjects" ALTER COLUMN "hourly_rate" SET DEFAULT '500.00';