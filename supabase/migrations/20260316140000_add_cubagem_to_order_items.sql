-- Migration to add 'cubagem' column to order_items table
ALTER TABLE "public"."order_items" ADD COLUMN IF NOT EXISTS "cubagem" numeric DEFAULT 0;
