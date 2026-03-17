-- 1. Correct the pickups status constraint natively (all lowercase as expected by React)
ALTER TABLE public.pickups DROP CONSTRAINT IF EXISTS pickups_status_check;
ALTER TABLE public.pickups ADD CONSTRAINT pickups_status_check CHECK (status IN ('emitida', 'solicitada', 'realizada', 'cancelada'));

-- 2. Clean old pickups if we want the 20 to be pristine
DELETE FROM public.pickups;

-- 3. Insert 20 random Mock Pickups strictly divided into each status to satisfy requirement
DO $$
DECLARE
  v_carrier_id uuid;
  v_users text[] := ARRAY['Fernanda Ribeiro', 'Bruno Azevedo', 'Gustavo Nascimento', 'Beatriz Costa', 'Thiago Souza'];
  v_statuses text[] := ARRAY['emitida', 'solicitada', 'realizada', 'cancelada'];
  v_status text;
  v_count integer := 1;
BEGIN
  -- Safely grab the first available carrier OR leave null
  SELECT id INTO v_carrier_id FROM public.carriers LIMIT 1;

  FOR v_status IN SELECT unnest(v_statuses)
  LOOP
    FOR i IN 1..5 LOOP
      INSERT INTO public.pickups (
        numero_coleta, 
        carrier_id, 
        status, 
        contato_nome,   -- Mapping logically to creator
        quantidade_volumes, 
        valor_total, 
        data_solicitacao,
        data_agendada,
        cidade, 
        estado,
        created_at,
        updated_at
      ) VALUES (
        'COL-' || lpad(v_count::text, 4, '0'),
        v_carrier_id,
        v_status,
        v_users[(v_count % 5) + 1],
        floor(random() * 50 + 1),
        floor(random() * 5000 + 100),
        now() - (random() * 10 * interval '1 day'),
        now() - (random() * 10 * interval '1 day'),
        'São Paulo',
        'SP',
        now() - (random() * 10 * interval '1 day'),
        now()
      );
      v_count := v_count + 1;
    END LOOP;
  END LOOP;
END $$;
