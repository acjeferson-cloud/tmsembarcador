-- Insert Driver App Innovation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM innovations WHERE innovation_key = 'driver_app' OR name = 'Aplicativo do Motorista') THEN
    INSERT INTO innovations (name, description, detailed_description, category, icon, is_active, monthly_price, display_order, innovation_key)
    VALUES (
      'Aplicativo do Motorista',
      'Aplicativo Android para roteirização, confirmações de entregas entre outras ações',
      'Aplicativo Android para roteirização, confirmações de entregas entre outras ações. Exige o Módulo de Roteirização.',
      'operacional',
      'Package',
      true,
      0,
      11,
      'driver_app'
    );
  END IF;
END $$;
