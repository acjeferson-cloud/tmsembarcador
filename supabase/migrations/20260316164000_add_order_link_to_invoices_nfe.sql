-- Migration to add order_serie and order_number to invoices_nfe
ALTER TABLE "public"."invoices_nfe" ADD COLUMN IF NOT EXISTS "order_serie" text null;
ALTER TABLE "public"."invoices_nfe" ADD COLUMN IF NOT EXISTS "order_number" text null;
