CREATE TABLE "email_deliveries" (
	"notification_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"owner" uuid,
	"lease_expires_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_error" text,
	CONSTRAINT "email_deliveries_notification_id_mode_pk" PRIMARY KEY("notification_id","mode")
);
--> statement-breakpoint
ALTER TABLE "email_deliveries" ADD CONSTRAINT "email_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;