ALTER TABLE "students" DROP COLUMN "class_format_pref";--> statement-breakpoint
ALTER TABLE "tutors" DROP COLUMN "class_format";--> statement-breakpoint
DROP TYPE "public"."class_format";