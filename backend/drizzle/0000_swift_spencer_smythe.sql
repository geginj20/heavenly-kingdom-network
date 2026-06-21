CREATE TABLE "bible_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"book" text NOT NULL,
	"verse" integer,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"donor_name" text NOT NULL,
	"donor_email" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'KES',
	"recurring" boolean DEFAULT false,
	"payment_provider" text,
	"payment_reference" text,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "event_rsvps" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"date" text NOT NULL,
	"day" text NOT NULL,
	"month" text NOT NULL,
	"time" text NOT NULL,
	"timezone" text DEFAULT 'EST',
	"location" text NOT NULL,
	"is_online" boolean DEFAULT false,
	"image" text,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prayer_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"prayer_id" integer NOT NULL,
	"user_id" text,
	"name" text DEFAULT 'Anonymous',
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prayers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text DEFAULT 'Anonymous' NOT NULL,
	"anonymous" boolean DEFAULT true,
	"category" text NOT NULL,
	"text" text NOT NULL,
	"prayers" integer DEFAULT 0,
	"comments" integer DEFAULT 0,
	"status" text DEFAULT 'approved',
	"user_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sermons" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"speaker" text NOT NULL,
	"ministry" text NOT NULL,
	"duration" text NOT NULL,
	"category" text NOT NULL,
	"thumbnail" text,
	"audio_url" text,
	"video_url" text,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"role" text DEFAULT 'member',
	"avatar" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "bible_notes" ADD CONSTRAINT "bible_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_comments" ADD CONSTRAINT "prayer_comments_prayer_id_prayers_id_fk" FOREIGN KEY ("prayer_id") REFERENCES "public"."prayers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayer_comments" ADD CONSTRAINT "prayer_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prayers" ADD CONSTRAINT "prayers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;