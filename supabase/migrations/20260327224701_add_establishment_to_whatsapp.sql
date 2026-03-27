-- Add establishment_id to whatsapp tables if they don't have it

ALTER TABLE public.whatsapp_config
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE;

ALTER TABLE public.whatsapp_templates
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE;

ALTER TABLE public.whatsapp_messages_log
ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_config_establishment 
ON public.whatsapp_config(establishment_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_establishment 
ON public.whatsapp_templates(establishment_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_log_establishment 
ON public.whatsapp_messages_log(establishment_id);
