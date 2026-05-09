-- Add cep column to taxation_members
ALTER TABLE public.taxation_members
ADD COLUMN IF NOT EXISTS cep text;
