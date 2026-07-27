CREATE INDEX IF NOT EXISTS "report_created_at_idx" ON "report" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_created_at_idx" ON "customer" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "device_created_at_idx" ON "device" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "intervention_created_at_idx" ON "intervention" USING btree ("created_at");
