CREATE TABLE IF NOT EXISTS "auth_sessions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auth_sessions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userEmail" varchar(255) NOT NULL,
	"tokenHash" varchar(64) NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_sessions_tokenHash_unique" UNIQUE("tokenHash")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" varchar(255);--> statement-breakpoint

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'users'
			AND column_name = 'subscriptionID'
	)
	AND NOT EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
			AND table_name = 'users'
			AND column_name = 'subscriptionId'
	) THEN
		ALTER TABLE "users" RENAME COLUMN "subscriptionID" TO "subscriptionId";
	END IF;
END $$;
--> statement-breakpoint

DO $$
BEGIN
	ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userEmail_users_email_fk" FOREIGN KEY ("userEmail") REFERENCES "public"."users"("email") ON DELETE no action ON UPDATE no action;
EXCEPTION
	WHEN duplicate_object THEN
		NULL;
END $$;