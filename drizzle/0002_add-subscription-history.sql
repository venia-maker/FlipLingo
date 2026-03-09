CREATE TABLE "subscription_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"event_type" text NOT NULL,
	"status" text NOT NULL,
	"price_id" text,
	"amount" integer,
	"interval" text,
	"current_period_end" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancel_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sub_history_user_id_idx" ON "subscription_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sub_history_stripe_sub_id_idx" ON "subscription_history" USING btree ("stripe_subscription_id");