-- Drop incorrect foreign keys referencing auth.users since the app uses public.users for auth logic
ALTER TABLE public.import_logs DROP CONSTRAINT IF EXISTS import_logs_performed_by_fkey;
ALTER TABLE public.freight_adjustments DROP CONSTRAINT IF EXISTS freight_adjustments_performed_by_fkey;

-- Add optional FK referencing the correct public.users table or just let it float (we'll link to public.users for DB integrity)
ALTER TABLE public.import_logs ADD CONSTRAINT import_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.freight_adjustments ADD CONSTRAINT freight_adjustments_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;
