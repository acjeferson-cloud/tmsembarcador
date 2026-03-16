-- Migration to add 'serie' column to orders table

ALTER TABLE "public"."orders" ADD COLUMN IF NOT EXISTS "serie" text null;
