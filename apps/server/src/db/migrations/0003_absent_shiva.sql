ALTER TABLE "tutor_subjects" ADD COLUMN "hourly_rate" numeric(10, 2) DEFAULT 500 NOT NULL;--> statement-breakpoint
ALTER TABLE "tutors" DROP COLUMN "hourly_rate";