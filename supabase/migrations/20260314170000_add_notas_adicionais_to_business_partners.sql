-- Add notas_adicionais column to business_partners table

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'business_partners' 
        AND column_name = 'notas_adicionais'
    ) THEN
        ALTER TABLE business_partners 
        ADD COLUMN notas_adicionais text;
    END IF;
END $$;
