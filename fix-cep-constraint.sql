-- Remoção da regra de cascata para evitar perda das faixas de CEP
ALTER TABLE zip_code_ranges 
DROP CONSTRAINT IF EXISTS zip_code_ranges_city_id_fkey,
ADD CONSTRAINT zip_code_ranges_city_id_fkey 
FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE RESTRICT;
