-- Migration: Spot Sync Triggers
-- Description: Removes brittle frontend logic for Spot Negotiation auto-advance and replaces it with rock-solid Postgres triggers.

-- TRIGGER 1: When a CT-e is imported (after Spot is already created)
CREATE OR REPLACE FUNCTION promote_spot_status_on_cte_import()
RETURNS trigger AS $$
DECLARE
  v_nfe_id UUID;
  v_normalized_number TEXT;
BEGIN
  -- Normalize number by removing leading zeros
  v_normalized_number := regexp_replace(NEW.number, '^0+', '');

  -- Find the NFE UUID by matching the CTE's invoice number to chave_acesso or normalized numero
  SELECT id INTO v_nfe_id 
  FROM public.invoices_nfe 
  WHERE chave_acesso = NEW.number OR numero = v_normalized_number
  LIMIT 1;

  IF v_nfe_id IS NOT NULL THEN
    -- Update any pending spot negotiation that is linked to this NFE
    UPDATE public.freight_spot_negotiations fsn
    SET status = 'aguardando_fatura'
    FROM public.freight_spot_invoices fsi
    WHERE fsn.id = fsi.negotiation_id
      AND fsi.invoice_id = v_nfe_id
      AND fsn.status = 'pendente_faturamento';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS promote_spot_status_on_cte_import_trg ON public.ctes_invoices;
CREATE TRIGGER promote_spot_status_on_cte_import_trg
AFTER INSERT ON public.ctes_invoices
FOR EACH ROW
EXECUTE FUNCTION promote_spot_status_on_cte_import();


-- TRIGGER 2: When a Spot is created (after CT-e is already imported)
CREATE OR REPLACE FUNCTION promote_spot_status_on_spot_create()
RETURNS trigger AS $$
DECLARE
  v_chave text;
  v_numero text;
  v_cte_exists boolean;
BEGIN
  -- Find NFE strings
  SELECT chave_acesso, regexp_replace(numero, '^0+', '') INTO v_chave, v_numero
  FROM public.invoices_nfe
  WHERE id = NEW.invoice_id;

  IF v_chave IS NOT NULL THEN
    -- Check if CTE exists for this NFE
    SELECT EXISTS (
      SELECT 1 FROM public.ctes_invoices
      WHERE number IN (v_chave, v_numero) OR regexp_replace(number, '^0+', '') = v_numero
    ) INTO v_cte_exists;

    IF v_cte_exists THEN
       UPDATE public.freight_spot_negotiations
       SET status = 'aguardando_fatura'
       WHERE id = NEW.negotiation_id AND status = 'pendente_faturamento';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS promote_spot_status_on_spot_create_trg ON public.freight_spot_invoices;
CREATE TRIGGER promote_spot_status_on_spot_create_trg
AFTER INSERT ON public.freight_spot_invoices
FOR EACH ROW
EXECUTE FUNCTION promote_spot_status_on_spot_create();

-- Backfill: Fix any stuck Spot Negotiations that are 'pendente_faturamento' but already have linked CT-es.
DO $$
DECLARE
  rec RECORD;
  v_chave text;
  v_numero text;
  v_cte_exists boolean;
BEGIN
  FOR rec IN (
    SELECT fsn.id, fsi.invoice_id 
    FROM public.freight_spot_negotiations fsn
    JOIN public.freight_spot_invoices fsi ON fsn.id = fsi.negotiation_id
    WHERE fsn.status = 'pendente_faturamento'
  ) LOOP
    SELECT chave_acesso, regexp_replace(numero, '^0+', '') INTO v_chave, v_numero
    FROM public.invoices_nfe
    WHERE id = rec.invoice_id;

    SELECT EXISTS (
      SELECT 1 FROM public.ctes_invoices
      WHERE number IN (v_chave, v_numero) OR regexp_replace(number, '^0+', '') = v_numero
    ) INTO v_cte_exists;

    IF v_cte_exists THEN
       UPDATE public.freight_spot_negotiations
       SET status = 'aguardando_fatura'
       WHERE id = rec.id;
    END IF;
  END LOOP;
END $$;
