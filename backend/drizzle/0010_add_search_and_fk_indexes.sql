CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_device_id_idx" ON "report" USING btree ("device_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_issue_id_idx" ON "report" USING btree ("issue_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_collaborator_id_idx" ON "report" USING btree ("collaborator_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_customer_id_idx" ON "report" USING btree ("customer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_note_trgm_idx" ON "report" USING gin ("note" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_password_trgm_idx" ON "report" USING gin ("password" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_issue_description_trgm_idx" ON "report" USING gin ("issue_description" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "report_service_description_trgm_idx" ON "report" USING gin ("service_description" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_first_name_trgm_idx" ON "customer" USING gin ("first_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_last_name_trgm_idx" ON "customer" USING gin ("last_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_phone_number_trgm_idx" ON "customer" USING gin ("phone_number" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_phone_number_secondary_trgm_idx" ON "customer" USING gin ("phone_number_secondary" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_email_trgm_idx" ON "customer" USING gin ("email" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collaborator_first_name_trgm_idx" ON "collaborator" USING gin ("first_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collaborator_last_name_trgm_idx" ON "collaborator" USING gin ("last_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "collaborator_phone_number_trgm_idx" ON "collaborator" USING gin ("phone_number" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "technician_first_name_trgm_idx" ON "technician" USING gin ("first_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "technician_last_name_trgm_idx" ON "technician" USING gin ("last_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "technician_phone_number_trgm_idx" ON "technician" USING gin ("phone_number" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "technician_vat_number_trgm_idx" ON "technician" USING gin ("vat_number" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_name_trgm_idx" ON "device" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "issue_description_trgm_idx" ON "issue" USING gin ("description" gin_trgm_ops);
