TRUNCATE TABLE "intervention";
--> statement-breakpoint
ALTER TABLE "intervention" DROP CONSTRAINT "intervention_technician_id_technician_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "intervention_technician_id_idx";
--> statement-breakpoint
ALTER TABLE "intervention" DROP COLUMN "technician_id";
--> statement-breakpoint
ALTER TABLE "intervention" ADD COLUMN "collaborator_id" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "intervention" ADD CONSTRAINT "intervention_collaborator_id_collaborator_id_fk" FOREIGN KEY ("collaborator_id") REFERENCES "public"."collaborator"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intervention_collaborator_id_idx" ON "intervention" USING btree ("collaborator_id");
