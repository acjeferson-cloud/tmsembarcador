-- ============================================================================
-- Migration: Add TEC fee type
-- Date: 2026-03-20
-- ============================================================================

DO $$
BEGIN
  -- Drop the existing constraint (PostgreSQL names it implicitly, usually freight_rate_additional_fees_fee_type_check)
  ALTER TABLE public.freight_rate_additional_fees DROP CONSTRAINT IF EXISTS freight_rate_additional_fees_fee_type_check;
  
  -- Add the new constraint explicitly named, adding 'TEC'
  ALTER TABLE public.freight_rate_additional_fees ADD CONSTRAINT freight_rate_additional_fees_fee_type_check CHECK (fee_type IN ('TDA', 'TDE', 'TRT', 'TEC'));
END $$;
