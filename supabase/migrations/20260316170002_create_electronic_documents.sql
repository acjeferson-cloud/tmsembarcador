-- Create the electronic_documents table if it does not exist
CREATE TABLE IF NOT EXISTS public.electronic_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID,
    environment_id UUID,
    document_type text NOT NULL, -- 'NFe' or 'CTe'
    model text NOT NULL, -- '55' or '57'
    document_number text NOT NULL,
    series text NOT NULL,
    access_key text NOT NULL,
    authorization_protocol text,
    authorization_date timestamp with time zone,
    status text NOT NULL, -- 'processing' | 'authorized' | 'cancelled' | 'denied'
    import_date timestamp with time zone DEFAULT now(),
    
    issuer_name text NOT NULL,
    issuer_document text NOT NULL,
    issuer_address jsonb,
    
    recipient_name text,
    recipient_document text,
    recipient_address jsonb,
    
    total_value numeric,
    icms_value numeric,
    freight_value numeric,
    total_weight numeric,
    transport_mode text,
    
    xml_content text,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Give access to roles
GRANT ALL ON TABLE public.electronic_documents TO anon;
GRANT ALL ON TABLE public.electronic_documents TO authenticated;
GRANT ALL ON TABLE public.electronic_documents TO service_role;

-- Disable RLS initially so inserts don't fail, but leave note for future securing
ALTER TABLE public.electronic_documents DISABLE ROW LEVEL SECURITY;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_electronic_documents_modtime()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_electronic_documents_modtime ON public.electronic_documents;

CREATE TRIGGER trg_electronic_documents_modtime
BEFORE UPDATE ON public.electronic_documents
FOR EACH ROW EXECUTE PROCEDURE update_electronic_documents_modtime();

-- Force schema reload for PostgREST
NOTIFY pgrst, 'reload schema';
