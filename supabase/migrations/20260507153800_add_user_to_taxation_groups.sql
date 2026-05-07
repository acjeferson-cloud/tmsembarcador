-- Add created_by_user_name to taxation_groups
ALTER TABLE public.taxation_groups ADD COLUMN IF NOT EXISTS created_by_user_name VARCHAR;
