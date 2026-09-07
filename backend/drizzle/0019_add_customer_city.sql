ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "city" varchar(255);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "customer_city_trgm_idx" ON "customer" USING gin ("city" gin_trgm_ops);
