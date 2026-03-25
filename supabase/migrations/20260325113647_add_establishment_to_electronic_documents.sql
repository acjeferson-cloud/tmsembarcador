ALTER TABLE electronic_documents ADD COLUMN IF NOT EXISTS establishment_id UUID REFERENCES establishments(id) ON DELETE RESTRICT;
