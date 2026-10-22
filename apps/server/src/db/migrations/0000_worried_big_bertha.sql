CREATE TYPE "public"."day_of_week" AS ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('DEGREE_TRANSCRIPT', 'CV', 'SUBJECT_QUALIFICATION');--> statement-breakpoint
CREATE TYPE "public"."email_status" AS ENUM('NONE', 'PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."learning_goal" AS ENUM('SCHOOL_CURRICULUM', 'COMPETITIONS', 'STANDARDIZED_EXAMS', 'PRACTICAL_APPLICATION', 'A_LEVEL', 'TPAT', 'TGAT', 'GENERAL_SKILLS');--> statement-breakpoint
CREATE TYPE "public"."notification_event_type" AS ENUM('TUTOR_SELECTED', 'VERIFICATION_APPROVED', 'VERIFICATION_REJECTED', 'NEW_REVIEW');--> statement-breakpoint
CREATE TYPE "public"."subject_category" AS ENUM('GENERAL_LEARNING', 'LANGUAGE_TESTING', 'UNIVERSITY_ENTRANCE');--> statement-breakpoint
CREATE TYPE "public"."tutor_type" AS ENUM('UNDERGRADUATE', 'FREELANCE', 'INSTITUTIONAL');--> statement-breakpoint
CREATE TYPE "public"."tutor_type_pref" AS ENUM('UNDERGRADUATE', 'FREELANCE', 'INSTITUTIONAL', 'ANY');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('STUDENT', 'TUTOR', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cognito_sub" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_cognito_sub_unique" UNIQUE("cognito_sub"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone_number" varchar(20),
	"line_id" varchar(100),
	"grade_level" varchar(20) NOT NULL,
	"tutor_type_pref" "tutor_type_pref" NOT NULL,
	"style_profile" integer[] NOT NULL,
	"personality_profile" integer[] NOT NULL,
	"budget_max" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutors" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"line_id" varchar(100),
	"description" text,
	"tutor_type" "tutor_type" NOT NULL,
	"style_profile" integer[] NOT NULL,
	"personality_profile" integer[] NOT NULL,
	"verification_status" "verification_status" DEFAULT 'PENDING' NOT NULL,
	"rejection_reason" text,
	"average_rating" numeric(3, 2) DEFAULT '0.00' NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_subject_requirements" (
	"student_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	CONSTRAINT "student_subject_requirements_student_id_variant_id_pk" PRIMARY KEY("student_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "subject_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"learning_goal" "learning_goal" NOT NULL,
	"requires_proof" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"category" "subject_category" NOT NULL,
	CONSTRAINT "subjects_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tutor_subjects" (
	"tutor_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL,
	"hourly_rate" numeric(10, 2) DEFAULT '500.00' NOT NULL,
	"grade_levels" varchar(20)[],
	"teaching_focus" varchar(255),
	CONSTRAINT "tutor_subjects_tutor_id_variant_id_pk" PRIMARY KEY("tutor_id","variant_id")
);
--> statement-breakpoint
CREATE TABLE "availabilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tutor_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"variant_id" uuid,
	"file_key" varchar(500) NOT NULL,
	"file_size_kb" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_file_key_unique" UNIQUE("file_key")
);
--> statement-breakpoint
CREATE TABLE "match_recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_request_id" uuid NOT NULL,
	"tutor_id" uuid NOT NULL,
	"rank" integer NOT NULL,
	"score" numeric(5, 2) NOT NULL,
	"is_selected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"status" varchar(50) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"tutor_id" uuid NOT NULL,
	"recommendation_id" uuid NOT NULL,
	"rating_knowledge" integer NOT NULL,
	"rating_preparation" integer NOT NULL,
	"rating_clarity" integer NOT NULL,
	"rating_punctuality" integer NOT NULL,
	"overall_rating" numeric(3, 2) NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event_type" "notification_event_type" NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"requires_email" boolean DEFAULT false NOT NULL,
	"email_status" "email_status" DEFAULT 'NONE' NOT NULL,
	"email_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutors" ADD CONSTRAINT "tutors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_subject_requirements" ADD CONSTRAINT "student_subject_requirements_student_id_students_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_subject_requirements" ADD CONSTRAINT "student_subject_requirements_variant_id_subject_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."subject_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_variants" ADD CONSTRAINT "subject_variants_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_subjects" ADD CONSTRAINT "tutor_subjects_tutor_id_tutors_user_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutor_subjects" ADD CONSTRAINT "tutor_subjects_variant_id_subject_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."subject_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availabilities" ADD CONSTRAINT "availabilities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_tutor_id_tutors_user_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_variant_id_subject_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."subject_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_recommendations" ADD CONSTRAINT "match_recommendations_match_request_id_match_requests_id_fk" FOREIGN KEY ("match_request_id") REFERENCES "public"."match_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_recommendations" ADD CONSTRAINT "match_recommendations_tutor_id_tutors_user_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_requests" ADD CONSTRAINT "match_requests_student_id_students_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_student_id_students_user_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tutor_id_tutors_user_id_fk" FOREIGN KEY ("tutor_id") REFERENCES "public"."tutors"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_recommendation_id_match_recommendations_id_fk" FOREIGN KEY ("recommendation_id") REFERENCES "public"."match_recommendations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;