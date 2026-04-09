-- Adiciona novos campos de controle regulatório e de segurança em coletas

ALTER TABLE public.pickup_proofs 
ADD COLUMN IF NOT EXISTS driver_document text,
ADD COLUMN IF NOT EXISTS rntrc text,
ADD COLUMN IF NOT EXISTS has_hazardous_materials boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_mopp_course boolean;
