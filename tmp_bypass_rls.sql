CREATE OR REPLACE FUNCTION bypass_insert_freight_quotes_history(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  returned_record RECORD;
BEGIN
  INSERT INTO freight_quotes_history (
    organization_id, environment_id, user_id, user_display_name, establishment_id,
    business_partner_id, origin_city_id, destination_city_id, origin_zip_code, destination_zip_code,
    weight, volume_qty, cubic_meters, cargo_value, quote_results,
    best_carrier_id, best_carrier_value, delivery_days, delivery_deadline, selected_modals
  )
  VALUES (
    (payload->>'organization_id')::uuid,
    (payload->>'environment_id')::uuid,
    NULLIF(payload->>'user_id', '')::uuid,
    payload->>'user_display_name',
    NULLIF(payload->>'establishment_id', '')::uuid,
    NULLIF(payload->>'business_partner_id', '')::uuid,
    NULLIF(payload->>'origin_city_id', '')::uuid,
    NULLIF(payload->>'destination_city_id', '')::uuid,
    payload->>'origin_zip_code',
    payload->>'destination_zip_code',
    COALESCE((payload->>'weight')::numeric, 0),
    COALESCE((payload->>'volume_qty')::numeric, 1),
    (payload->>'cubic_meters')::numeric,
    COALESCE((payload->>'cargo_value')::numeric, 0),
    COALESCE(payload->'quote_results', '[]'::jsonb),
    NULLIF(payload->>'best_carrier_id', '')::uuid,
    (payload->>'best_carrier_value')::numeric,
    (payload->>'delivery_days')::integer,
    (payload->>'delivery_deadline')::date,
    COALESCE(payload->'selected_modals', '[]'::jsonb)
  )
  RETURNING * INTO returned_record;
  
  RETURN to_jsonb(returned_record);
END;
$$;
