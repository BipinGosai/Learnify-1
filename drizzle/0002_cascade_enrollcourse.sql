ALTER TABLE "enrollCourse" DROP CONSTRAINT IF EXISTS "enrollCourse_cid_courses_cid_fk";
--> statement-breakpoint
ALTER TABLE "enrollCourse"
ADD CONSTRAINT "enrollCourse_cid_courses_cid_fk"
FOREIGN KEY ("cid") REFERENCES "public"."courses"("cid")
ON DELETE cascade ON UPDATE no action;
