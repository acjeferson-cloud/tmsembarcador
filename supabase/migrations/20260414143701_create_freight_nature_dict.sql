-- Migration: 20260414143701_create_freight_nature_dict.sql
-- Cria o Dicionário De/Para dinâmico de gatilhos XML para identificação semântica de Devoluções e Reentregas.

CREATE TABLE IF NOT EXISTS public.freight_nature_dict (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE,
    xml_tag VARCHAR(50) NOT NULL,
    search_string VARCHAR(255) NOT NULL,
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('DEVOLUCAO', 'REENTREGA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    organization_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    establishment_id UUID REFERENCES public.establishments(id) ON DELETE CASCADE,
    scope VARCHAR(20) NOT NULL DEFAULT 'ESTABLISHMENT' CHECK (scope IN ('ESTABLISHMENT', 'ENVIRONMENT', 'ORGANIZATION'))
);

-- Habilita o RLS
ALTER TABLE public.freight_nature_dict ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS padrão baseada no Scope Contextual do TMS Empresarial
CREATE POLICY "freight_nature_dict_select_policy"
    ON public.freight_nature_dict FOR SELECT
    USING (
        organization_id = (current_setting('app.current_org_id', true))::uuid
        AND environment_id = (current_setting('app.current_env_id', true))::uuid
        AND (
            (scope = 'ESTABLISHMENT' AND establishment_id = (current_setting('app.current_est_id', true))::uuid)
            OR scope = 'ENVIRONMENT'
            OR scope = 'ORGANIZATION'
        )
    );

CREATE POLICY "freight_nature_dict_insert_policy"
    ON public.freight_nature_dict FOR INSERT
    WITH CHECK (
        organization_id = (current_setting('app.current_org_id', true))::uuid
        AND environment_id = (current_setting('app.current_env_id', true))::uuid
    );

CREATE POLICY "freight_nature_dict_update_policy"
    ON public.freight_nature_dict FOR UPDATE
    USING (
        organization_id = (current_setting('app.current_org_id', true))::uuid
        AND environment_id = (current_setting('app.current_env_id', true))::uuid
        AND (
            (scope = 'ESTABLISHMENT' AND establishment_id = (current_setting('app.current_est_id', true))::uuid)
            OR scope = 'ENVIRONMENT'
            OR scope = 'ORGANIZATION'
        )
    )
    WITH CHECK (
        organization_id = (current_setting('app.current_org_id', true))::uuid
        AND environment_id = (current_setting('app.current_env_id', true))::uuid
    );

CREATE POLICY "freight_nature_dict_delete_policy"
    ON public.freight_nature_dict FOR DELETE
    USING (
        organization_id = (current_setting('app.current_org_id', true))::uuid
        AND environment_id = (current_setting('app.current_env_id', true))::uuid
        AND (
            (scope = 'ESTABLISHMENT' AND establishment_id = (current_setting('app.current_est_id', true))::uuid)
            OR scope = 'ENVIRONMENT'
            OR scope = 'ORGANIZATION'
        )
    );
