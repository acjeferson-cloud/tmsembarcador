-- ============================================
-- COMPLETE POSTGRESQL DATABASE SCHEMA
-- Generated: 2026-02-17
-- Database: Supabase PostgreSQL
-- Total Tables: 70
-- ============================================
--
-- This schema represents a complete multi-tenant TMS (Transport Management System)
-- with support for:
-- - Multi-organization with environments (production, staging, etc.)
-- - Freight management (quotes, rates, CTEs)
-- - Invoice and billing management
-- - Carrier and business partner management
-- - NPS (Net Promoter Score) tracking
-- - WhatsApp integration
-- - API key management and rotation
-- - Deployment tracking
-- - RLS (Row Level Security) for data isolation
--
-- ============================================

-- ============================================
-- EXTENSIONS
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA graphql;
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA vault;

-- ============================================
-- SEQUENCES
-- ============================================

CREATE SEQUENCE IF NOT EXISTS public.cities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.freight_quotes_history_quote_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS public.zip_code_ranges_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2147483647
    CACHE 1;

-- ============================================
-- CORE TABLES - SaaS Foundation
-- ============================================

-- SaaS Plans
CREATE TABLE public.saas_plans (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price_monthly numeric(10,2),
    price_yearly numeric(10,2),
    max_users integer,
    max_establishments integer,
    max_orders_per_month integer,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.saas_plans
    ADD CONSTRAINT saas_plans_pkey PRIMARY KEY (id),
    ADD CONSTRAINT saas_plans_slug_key UNIQUE (slug);

-- Organizations
CREATE TABLE public.organizations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL,
    domain text,
    plan_id uuid,
    is_active boolean DEFAULT true,
    trial_ends_at timestamp with time zone,
    subscription_status text DEFAULT 'trial'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id),
    ADD CONSTRAINT organizations_slug_key UNIQUE (slug),
    ADD CONSTRAINT organizations_domain_key UNIQUE (domain),
    ADD CONSTRAINT organizations_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES saas_plans(id),
    ADD CONSTRAINT organizations_subscription_status_check CHECK (subscription_status = ANY (ARRAY['active'::text, 'trial'::text, 'suspended'::text, 'cancelled'::text]));

-- Environments
CREATE TABLE public.environments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    type text NOT NULL,
    is_active boolean DEFAULT true,
    is_global boolean DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.environments
    ADD CONSTRAINT environments_pkey PRIMARY KEY (id),
    ADD CONSTRAINT environments_organization_id_slug_key UNIQUE (organization_id, slug),
    ADD CONSTRAINT environments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    ADD CONSTRAINT environments_type_check CHECK (type = ANY (ARRAY['production'::text, 'staging'::text, 'testing'::text, 'sandbox'::text, 'development'::text]));

-- Organization Settings
CREATE TABLE public.organization_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.organization_settings
    ADD CONSTRAINT organization_settings_pkey PRIMARY KEY (id),
    ADD CONSTRAINT organization_settings_organization_id_key UNIQUE (organization_id),
    ADD CONSTRAINT organization_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- SaaS Admins
CREATE TABLE public.saas_admins (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    name text NOT NULL,
    password_hash text NOT NULL,
    role text DEFAULT 'support'::text,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.saas_admins
    ADD CONSTRAINT saas_admins_pkey PRIMARY KEY (id),
    ADD CONSTRAINT saas_admins_email_key UNIQUE (email);

-- SaaS Admin Users
CREATE TABLE public.saas_admin_users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    is_active boolean DEFAULT true,
    last_login_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.saas_admin_users
    ADD CONSTRAINT saas_admin_users_pkey PRIMARY KEY (id),
    ADD CONSTRAINT saas_admin_users_email_key UNIQUE (email),
    ADD CONSTRAINT saas_admin_users_role_check CHECK (role = ANY (ARRAY['super_admin'::text, 'support'::text]));

-- ============================================
-- GEOGRAPHY TABLES
-- ============================================

-- Countries
CREATE TABLE public.countries (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL,
    name text NOT NULL,
    native_name text,
    phone_code text,
    continent text,
    capital text,
    currency text,
    languages text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id),
    ADD CONSTRAINT countries_code_key UNIQUE (code),
    ADD CONSTRAINT countries_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
    ADD CONSTRAINT countries_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

-- States
CREATE TABLE public.states (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    abbreviation text NOT NULL,
    ibge_code text NOT NULL,
    region text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.states
    ADD CONSTRAINT states_pkey PRIMARY KEY (id),
    ADD CONSTRAINT states_abbreviation_key UNIQUE (abbreviation),
    ADD CONSTRAINT states_ibge_code_key UNIQUE (ibge_code),
    ADD CONSTRAINT states_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
    ADD CONSTRAINT states_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

-- Cities
CREATE TABLE public.cities (
    id integer NOT NULL DEFAULT nextval('cities_id_seq'::regclass),
    name text NOT NULL,
    state_abbreviation text NOT NULL,
    ibge_code text,
    zip_code_start text,
    zip_code_end text,
    latitude numeric(10,6),
    longitude numeric(10,6),
    region text,
    type text DEFAULT 'cidade'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id),
    ADD CONSTRAINT cities_type_check CHECK (type = ANY (ARRAY['cidade'::text, 'distrito'::text, 'povoado'::text]));

-- Zip Code Ranges
CREATE TABLE public.zip_code_ranges (
    id integer NOT NULL DEFAULT nextval('zip_code_ranges_id_seq'::regclass),
    city_id integer NOT NULL,
    start_zip text NOT NULL,
    end_zip text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.zip_code_ranges
    ADD CONSTRAINT zip_code_ranges_pkey PRIMARY KEY (id),
    ADD CONSTRAINT zip_code_ranges_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;

-- Holidays
CREATE TABLE public.holidays (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    type text NOT NULL,
    country_id uuid,
    state_id uuid,
    city_id integer,
    is_recurring boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id),
    ADD CONSTRAINT holidays_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT holidays_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT holidays_country_id_fkey FOREIGN KEY (country_id) REFERENCES countries(id) ON DELETE CASCADE,
    ADD CONSTRAINT holidays_state_id_fkey FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE,
    ADD CONSTRAINT holidays_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE,
    ADD CONSTRAINT holidays_type_check CHECK (type = ANY (ARRAY['nacional'::text, 'estadual'::text, 'municipal'::text]));

-- ============================================
-- USER AND ESTABLISHMENT TABLES
-- ============================================

-- Establishments
CREATE TABLE public.establishments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    codigo text NOT NULL,
    cnpj text NOT NULL,
    inscricao_estadual text,
    razao_social text NOT NULL,
    fantasia text NOT NULL,
    endereco text,
    bairro text,
    cep text,
    cidade text,
    estado text,
    tipo text NOT NULL,
    tracking_prefix text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.establishments
    ADD CONSTRAINT establishments_pkey PRIMARY KEY (id),
    ADD CONSTRAINT establishments_org_env_codigo_key UNIQUE (organization_id, environment_id, codigo),
    ADD CONSTRAINT establishments_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT establishments_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT establishments_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT establishments_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT establishments_tipo_check CHECK (tipo = ANY (ARRAY['matriz'::text, 'filial'::text]));

-- Users
CREATE TABLE public.users (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    codigo text NOT NULL,
    nome text NOT NULL,
    email text NOT NULL,
    senha text NOT NULL,
    cpf text,
    telefone text,
    celular text,
    phone text,
    cargo text,
    departamento text,
    perfil text NOT NULL,
    permissoes jsonb DEFAULT '["all"]'::jsonb,
    status text DEFAULT 'ativo'::text,
    foto_perfil_url text,
    ultimo_login timestamp with time zone,
    tentativas_login integer DEFAULT 0,
    estabelecimento_id uuid,
    estabelecimentos_permitidos uuid[],
    two_factor_enabled boolean DEFAULT false,
    two_factor_secret text,
    preferred_language text DEFAULT 'pt'::text,
    theme_preference text,
    notification_settings jsonb DEFAULT '{}'::jsonb,
    has_license boolean DEFAULT false,
    license_key text,
    email_change_token_new text,
    email_change text,
    email_change_sent_at timestamp with time zone,
    email_change_token_current text DEFAULT ''::text,
    email_change_confirm_status smallint DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id),
    ADD CONSTRAINT users_codigo_key UNIQUE (codigo),
    ADD CONSTRAINT users_email_key UNIQUE (email),
    ADD CONSTRAINT users_cpf_key UNIQUE (cpf),
    ADD CONSTRAINT users_phone_key UNIQUE (phone),
    ADD CONSTRAINT users_license_key_key UNIQUE (license_key),
    ADD CONSTRAINT users_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT users_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT users_perfil_check CHECK (perfil = ANY (ARRAY['administrador'::text, 'gerente'::text, 'operador'::text, 'visualizador'::text, 'personalizado'::text])),
    ADD CONSTRAINT users_status_check CHECK (status = ANY (ARRAY['ativo'::text, 'inativo'::text, 'bloqueado'::text])),
    ADD CONSTRAINT users_preferred_language_check CHECK (preferred_language = ANY (ARRAY['pt'::text, 'en'::text, 'es'::text])),
    ADD CONSTRAINT users_email_change_confirm_status_check CHECK ((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2));

-- Licenses
CREATE TABLE public.licenses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    license_key text NOT NULL,
    organization_id uuid,
    plan_id uuid,
    max_users integer,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);

-- License Logs
CREATE TABLE public.license_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    license_key text NOT NULL,
    user_id uuid,
    action text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    performed_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.license_logs
    ADD CONSTRAINT license_logs_pkey PRIMARY KEY (id),
    ADD CONSTRAINT license_logs_action_check CHECK (action = ANY (ARRAY['assigned'::text, 'revoked'::text, 'transferred'::text, 'purchased'::text]));

-- ============================================
-- BUSINESS PARTNER TABLES
-- ============================================

-- Business Partners
CREATE TABLE public.business_partners (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    name text NOT NULL,
    legal_name text,
    document text NOT NULL,
    document_type text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'active'::text,
    tax_regime text,
    email text,
    phone text,
    website text,
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.business_partners
    ADD CONSTRAINT business_partners_pkey PRIMARY KEY (id),
    ADD CONSTRAINT business_partners_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT business_partners_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT business_partners_document_type_check CHECK (document_type = ANY (ARRAY['cpf'::text, 'cnpj'::text])),
    ADD CONSTRAINT business_partners_type_check CHECK (type = ANY (ARRAY['customer'::text, 'supplier'::text, 'both'::text])),
    ADD CONSTRAINT business_partners_status_check CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
    ADD CONSTRAINT business_partners_tax_regime_check CHECK ((tax_regime IS NULL) OR (tax_regime = ANY (ARRAY['simples'::text, 'presumido'::text, 'real'::text, 'mei'::text])));

-- Business Partner Addresses
CREATE TABLE public.business_partner_addresses (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    partner_id uuid NOT NULL,
    type text NOT NULL,
    street text NOT NULL,
    number text,
    complement text,
    neighborhood text,
    city text NOT NULL,
    state text NOT NULL,
    zip_code text NOT NULL,
    country text DEFAULT 'BR'::text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.business_partner_addresses
    ADD CONSTRAINT business_partner_addresses_pkey PRIMARY KEY (id),
    ADD CONSTRAINT business_partner_addresses_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE CASCADE,
    ADD CONSTRAINT business_partner_addresses_type_check CHECK (type = ANY (ARRAY['billing'::text, 'delivery'::text, 'correspondence'::text, 'commercial'::text]));

-- Business Partner Contacts
CREATE TABLE public.business_partner_contacts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    partner_id uuid NOT NULL,
    name text NOT NULL,
    role text,
    email text,
    phone text,
    mobile text,
    is_primary boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.business_partner_contacts
    ADD CONSTRAINT business_partner_contacts_pkey PRIMARY KEY (id),
    ADD CONSTRAINT business_partner_contacts_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES business_partners(id) ON DELETE CASCADE;

-- ============================================
-- CARRIER TABLES
-- ============================================

-- Carriers
CREATE TABLE public.carriers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    codigo text NOT NULL,
    razao_social text NOT NULL,
    fantasia text NOT NULL,
    cnpj text NOT NULL,
    inscricao_estadual text,
    endereco text,
    bairro text,
    cep text,
    cidade_id uuid,
    estado_id uuid,
    pais_id uuid,
    telefone text,
    email text,
    contato text,
    observacoes text,
    status text DEFAULT 'ativo'::text,
    rating numeric(2,1),
    nps_interno numeric(5,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.carriers
    ADD CONSTRAINT carriers_pkey PRIMARY KEY (id),
    ADD CONSTRAINT carriers_codigo_key UNIQUE (codigo),
    ADD CONSTRAINT carriers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT carriers_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT carriers_cidade_id_fkey FOREIGN KEY (cidade_id) REFERENCES cities(id) ON DELETE SET NULL,
    ADD CONSTRAINT carriers_estado_id_fkey FOREIGN KEY (estado_id) REFERENCES states(id) ON DELETE SET NULL,
    ADD CONSTRAINT carriers_pais_id_fkey FOREIGN KEY (pais_id) REFERENCES countries(id) ON DELETE SET NULL,
    ADD CONSTRAINT carriers_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
    ADD CONSTRAINT carriers_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
    ADD CONSTRAINT carriers_status_check CHECK (status = ANY (ARRAY['ativo'::text, 'inativo'::text])),
    ADD CONSTRAINT carriers_rating_check CHECK ((rating >= 0::numeric) AND (rating <= 5::numeric));

-- Occurrences
CREATE TABLE public.occurrences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    codigo text NOT NULL,
    descricao text NOT NULL,
    tipo text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.occurrences
    ADD CONSTRAINT occurrences_pkey PRIMARY KEY (id),
    ADD CONSTRAINT occurrences_codigo_key UNIQUE (codigo),
    ADD CONSTRAINT occurrences_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT occurrences_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT occurrences_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
    ADD CONSTRAINT occurrences_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

-- Rejection Reasons
CREATE TABLE public.rejection_reasons (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    codigo text NOT NULL,
    descricao text NOT NULL,
    categoria text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.rejection_reasons
    ADD CONSTRAINT rejection_reasons_pkey PRIMARY KEY (id),
    ADD CONSTRAINT rejection_reasons_codigo_key UNIQUE (codigo),
    ADD CONSTRAINT rejection_reasons_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT rejection_reasons_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT rejection_reasons_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
    ADD CONSTRAINT rejection_reasons_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id);

-- ============================================
-- FREIGHT RATE TABLES
-- ============================================

-- Freight Rate Tables
CREATE TABLE public.freight_rate_tables (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    nome text NOT NULL,
    transportador_id uuid NOT NULL,
    data_inicio timestamp with time zone NOT NULL,
    data_fim timestamp with time zone NOT NULL,
    status text DEFAULT 'ativo'::text,
    table_type text NOT NULL,
    modal text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.freight_rate_tables
    ADD CONSTRAINT freight_rate_tables_pkey PRIMARY KEY (id),
    ADD CONSTRAINT freight_rate_tables_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT freight_rate_tables_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT freight_rate_tables_transportador_id_fkey FOREIGN KEY (transportador_id) REFERENCES carriers(id) ON DELETE CASCADE,
    ADD CONSTRAINT freight_rate_tables_table_type_check CHECK (table_type = ANY (ARRAY['Entrada'::text, 'Saída'::text])),
    ADD CONSTRAINT freight_rate_tables_modal_check CHECK (modal = ANY (ARRAY['rodoviario'::text, 'aereo'::text, 'aquaviario'::text, 'ferroviario'::text])),
    ADD CONSTRAINT valid_status CHECK (status = ANY (ARRAY['ativo'::text, 'inativo'::text])),
    ADD CONSTRAINT valid_dates CHECK (data_fim >= data_inicio);

-- Freight Rates
CREATE TABLE public.freight_rates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    freight_rate_table_id uuid NOT NULL,
    codigo text NOT NULL,
    descricao text,
    tipo_aplicacao text NOT NULL,
    prazo_entrega integer NOT NULL,
    valor numeric(10,2) NOT NULL,
    observacoes text,
    pedagio_minimo numeric(10,2),
    pedagio_por_kg numeric(10,4),
    pedagio_a_cada_kg integer,
    pedagio_tipo_kg text,
    icms_embutido_tabela boolean DEFAULT false,
    aliquota_icms numeric(5,2),
    fator_m3 numeric(10,4),
    fator_m3_apartir_kg numeric(10,2),
    fator_m3_apartir_m3 numeric(10,4),
    fator_m3_apartir_valor numeric(10,2),
    percentual_gris numeric(5,2),
    gris_minimo numeric(10,2),
    seccat numeric(10,2),
    despacho numeric(10,2),
    itr numeric(10,2),
    taxa_adicional numeric(10,2),
    coleta_entrega numeric(10,2),
    tde_trt numeric(10,2),
    tas numeric(10,2),
    taxa_suframa numeric(10,2),
    valor_outros_percent numeric(5,2),
    valor_outros_minimo numeric(10,2),
    taxa_outros_valor numeric(10,2),
    taxa_outros_tipo_valor text,
    taxa_apartir_de numeric(10,2),
    taxa_apartir_de_tipo text,
    taxa_outros_a_cada numeric(10,2),
    taxa_outros_minima numeric(10,2),
    frete_peso_minimo numeric(10,2),
    frete_valor_minimo numeric(10,2),
    frete_tonelada_minima numeric(10,2),
    frete_percentual_minimo numeric(5,2),
    frete_m3_minimo numeric(10,2),
    valor_total_minimo numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.freight_rates
    ADD CONSTRAINT freight_rates_pkey PRIMARY KEY (id),
    ADD CONSTRAINT freight_rates_table_codigo_unique UNIQUE (freight_rate_table_id, codigo),
    ADD CONSTRAINT freight_rates_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT freight_rates_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT freight_rates_table_id_fkey FOREIGN KEY (freight_rate_table_id) REFERENCES freight_rate_tables(id) ON DELETE CASCADE,
    ADD CONSTRAINT valid_prazo CHECK (prazo_entrega > 0),
    ADD CONSTRAINT valid_valor CHECK (valor >= 0::numeric),
    ADD CONSTRAINT valid_tipo_aplicacao CHECK (tipo_aplicacao = ANY (ARRAY['cidade'::text, 'cliente'::text, 'produto'::text]));

-- Freight Rate Details
CREATE TABLE public.freight_rate_details (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    freight_rate_id uuid NOT NULL,
    ordem integer NOT NULL,
    peso_ate numeric(10,2),
    m3_ate numeric(10,4),
    volume_ate integer,
    valor_ate numeric(10,2),
    valor_faixa numeric(10,2) NOT NULL,
    tipo_calculo text,
    tipo_frete text,
    frete_valor numeric(10,2),
    frete_minimo numeric(10,2),
    tipo_taxa text,
    taxa_minima numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.freight_rate_details
    ADD CONSTRAINT freight_rate_details_pkey PRIMARY KEY (id),
    ADD CONSTRAINT freight_rate_details_rate_id_fkey FOREIGN KEY (freight_rate_id) REFERENCES freight_rates(id) ON DELETE CASCADE;

-- Freight Rate Cities
CREATE TABLE public.freight_rate_cities (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    freight_rate_id uuid NOT NULL,
    freight_rate_table_id uuid NOT NULL,
    city_id integer NOT NULL,
    delivery_days integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.freight_rate_cities
    ADD CONSTRAINT freight_rate_cities_pkey PRIMARY KEY (id),
    ADD CONSTRAINT unique_freight_rate_city UNIQUE (freight_rate_id, city_id),
    ADD CONSTRAINT freight_rate_cities_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT freight_rate_cities_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT freight_rate_cities_rate_id_fkey FOREIGN KEY (freight_rate_id) REFERENCES freight_rates(id) ON DELETE CASCADE,
    ADD CONSTRAINT freight_rate_cities_table_id_fkey FOREIGN KEY (freight_rate_table_id) REFERENCES freight_rate_tables(id) ON DELETE CASCADE,
    ADD CONSTRAINT freight_rate_cities_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;

-- Freight Rate Additional Fees
CREATE TABLE public.freight_rate_additional_fees (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    freight_rate_table_id uuid NOT NULL,
    freight_rate_id uuid,
    nome text NOT NULL,
    tipo text NOT NULL,
    valor numeric(10,2) NOT NULL,
    minimo numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.freight_rate_additional_fees
    ADD CONSTRAINT freight_rate_additional_fees_pkey PRIMARY KEY (id),
    ADD CONSTRAINT freight_rate_additional_fees_table_id_fkey FOREIGN KEY (freight_rate_table_id) REFERENCES freight_rate_tables(id) ON DELETE CASCADE,
    ADD CONSTRAINT freight_rate_additional_fees_rate_id_fkey FOREIGN KEY (freight_rate_id) REFERENCES freight_rates(id) ON DELETE CASCADE,
    ADD CONSTRAINT valid_tipo CHECK (tipo = ANY (ARRAY['percentual'::text, 'valor_fixo'::text]));

-- Freight Rate Restricted Items
CREATE TABLE public.freight_rate_restricted_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    freight_rate_table_id uuid NOT NULL,
    freight_rate_id uuid NOT NULL,
    ncm text,
    ean text,
    descricao text NOT NULL,
    tipo_restricao text NOT NULL,
    observacoes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.freight_rate_restricted_items
    ADD CONSTRAINT freight_rate_restricted_items_pkey PRIMARY KEY (id),
    ADD CONSTRAINT freight_rate_restricted_items_table_id_fkey FOREIGN KEY (freight_rate_table_id) REFERENCES freight_rate_tables(id) ON DELETE CASCADE,
    ADD CONSTRAINT freight_rate_restricted_items_rate_id_fkey FOREIGN KEY (freight_rate_id) REFERENCES freight_rates(id) ON DELETE CASCADE,
    ADD CONSTRAINT valid_tipo_restricao CHECK (tipo_restricao = ANY (ARRAY['proibido'::text, 'taxa_adicional'::text, 'condicional'::text]));

-- ============================================
-- ORDER AND INVOICE TABLES
-- ============================================

-- Orders
CREATE TABLE public.orders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    order_number text NOT NULL,
    customer_id uuid,
    customer_name text,
    issue_date timestamp with time zone,
    entry_date timestamp with time zone,
    expected_delivery timestamp with time zone,
    carrier_id uuid,
    carrier_name text,
    freight_value numeric(10,2),
    order_value numeric(10,2),
    destination_city text,
    destination_state text,
    recipient_phone text,
    status text NOT NULL,
    tracking_code text,
    observations text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by integer,
    updated_by integer
);

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id),
    ADD CONSTRAINT orders_order_number_key UNIQUE (order_number),
    ADD CONSTRAINT orders_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT orders_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES business_partners(id),
    ADD CONSTRAINT orders_status_check CHECK (status = ANY (ARRAY['emitido'::text, 'coletado'::text, 'em_transito'::text, 'saiu_entrega'::text, 'entregue'::text, 'cancelado'::text]));

-- Order Items
CREATE TABLE public.order_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    product_code text,
    product_name text NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2),
    total_price numeric(10,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id),
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Order Delivery Status
CREATE TABLE public.order_delivery_status (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL,
    status text NOT NULL,
    date timestamp with time zone NOT NULL,
    location text,
    observation text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.order_delivery_status
    ADD CONSTRAINT order_delivery_status_pkey PRIMARY KEY (id),
    ADD CONSTRAINT order_delivery_status_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

-- Invoices
CREATE TABLE public.invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    invoice_number text NOT NULL,
    customer_id uuid,
    order_id uuid,
    issue_date timestamp with time zone,
    total_value numeric(10,2),
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id),
    ADD CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number),
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES business_partners(id),
    ADD CONSTRAINT invoices_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id),
    ADD CONSTRAINT invoices_status_check CHECK (status = ANY (ARRAY['Emitida'::text, 'Coletada'::text, 'Em Trânsito'::text, 'Saiu p/ Entrega'::text, 'Entregue'::text, 'Cancelada'::text]));

-- Bills
CREATE TABLE public.bills (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    bill_number text NOT NULL,
    customer_id uuid,
    issue_date timestamp with time zone,
    due_date timestamp with time zone,
    total_value numeric(10,2),
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.bills
    ADD CONSTRAINT bills_pkey PRIMARY KEY (id),
    ADD CONSTRAINT bills_bill_number_key UNIQUE (bill_number),
    ADD CONSTRAINT bills_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT bills_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT bills_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES business_partners(id),
    ADD CONSTRAINT bills_status_check CHECK (status = ANY (ARRAY['Importada'::text, 'Auditada e Aprovada'::text, 'Auditada e Reprovada'::text, 'Com NF-e Referenciada'::text, 'Cancelada'::text]));

-- Bill Invoices
CREATE TABLE public.bill_invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    bill_id uuid NOT NULL,
    invoice_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.bill_invoices
    ADD CONSTRAINT bill_invoices_pkey PRIMARY KEY (id),
    ADD CONSTRAINT bill_invoices_bill_id_invoice_id_key UNIQUE (bill_id, invoice_id),
    ADD CONSTRAINT bill_invoices_bill_id_fkey FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    ADD CONSTRAINT bill_invoices_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- ============================================
-- NFe (Electronic Invoice) TABLES
-- ============================================

-- Invoices NFe
CREATE TABLE public.invoices_nfe (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    establishment_id uuid NOT NULL,
    access_key text NOT NULL,
    number text NOT NULL,
    series text,
    invoice_type text NOT NULL,
    status text NOT NULL,
    issue_date timestamp with time zone NOT NULL,
    total_value numeric(10,2),
    carrier_id uuid,
    xml_content text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.invoices_nfe
    ADD CONSTRAINT invoices_nfe_pkey PRIMARY KEY (id),
    ADD CONSTRAINT invoices_nfe_access_key_key UNIQUE (access_key),
    ADD CONSTRAINT invoices_nfe_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT invoices_nfe_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT invoices_nfe_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    ADD CONSTRAINT invoices_nfe_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES carriers(id),
    ADD CONSTRAINT invoices_nfe_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
    ADD CONSTRAINT invoices_nfe_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
    ADD CONSTRAINT invoices_nfe_invoice_type_check CHECK (invoice_type = ANY (ARRAY['Saída'::text, 'Entrada'::text, 'Devolução'::text, 'Emitida'::text, 'Pendente'::text, 'Cancelada'::text])),
    ADD CONSTRAINT invoices_nfe_status_check CHECK (status = ANY (ARRAY['Validada'::text, 'Cancelada'::text, 'Pendente'::text, 'Emitida'::text]));

-- Invoices NFe Carriers
CREATE TABLE public.invoices_nfe_carriers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL,
    carrier_id uuid,
    carrier_name text,
    carrier_document text,
    freight_value numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.invoices_nfe_carriers
    ADD CONSTRAINT invoices_nfe_carriers_pkey PRIMARY KEY (id),
    ADD CONSTRAINT invoices_nfe_carriers_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices_nfe(id) ON DELETE CASCADE,
    ADD CONSTRAINT invoices_nfe_carriers_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES carriers(id);

-- Invoices NFe Customers
CREATE TABLE public.invoices_nfe_customers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL,
    customer_name text NOT NULL,
    customer_document text,
    customer_address text,
    customer_city text,
    customer_state text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.invoices_nfe_customers
    ADD CONSTRAINT invoices_nfe_customers_pkey PRIMARY KEY (id),
    ADD CONSTRAINT invoices_nfe_customers_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices_nfe(id) ON DELETE CASCADE;

-- Invoices NFe Occurrences
CREATE TABLE public.invoices_nfe_occurrences (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL,
    occurrence_id uuid,
    occurrence_date timestamp with time zone NOT NULL,
    description text,
    responsible_user_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.invoices_nfe_occurrences
    ADD CONSTRAINT invoices_nfe_occurrences_pkey PRIMARY KEY (id),
    ADD CONSTRAINT invoices_nfe_occurrences_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices_nfe(id) ON DELETE CASCADE,
    ADD CONSTRAINT invoices_nfe_occurrences_occurrence_id_fkey FOREIGN KEY (occurrence_id) REFERENCES occurrences(id),
    ADD CONSTRAINT invoices_nfe_occurrences_responsible_user_id_fkey FOREIGN KEY (responsible_user_id) REFERENCES auth.users(id);

-- Invoices NFe Products
CREATE TABLE public.invoices_nfe_products (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    invoice_id uuid NOT NULL,
    product_code text,
    product_name text NOT NULL,
    ncm text,
    quantity numeric(10,3) NOT NULL,
    unit_value numeric(10,2) NOT NULL,
    total_value numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.invoices_nfe_products
    ADD CONSTRAINT invoices_nfe_products_pkey PRIMARY KEY (id),
    ADD CONSTRAINT invoices_nfe_products_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES invoices_nfe(id) ON DELETE CASCADE;

-- ============================================
-- CTE (CT-e - Electronic Transport Document) TABLES
-- ============================================

-- CTes Complete
CREATE TABLE public.ctes_complete (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    establishment_id uuid NOT NULL,
    number text NOT NULL,
    access_key text NOT NULL,
    series text,
    issue_date timestamp with time zone NOT NULL,
    carrier_id uuid,
    freight_rate_table_id uuid,
    total_value numeric(10,2),
    xml_content text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.ctes_complete
    ADD CONSTRAINT ctes_complete_pkey PRIMARY KEY (id),
    ADD CONSTRAINT ctes_complete_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES establishments(id),
    ADD CONSTRAINT ctes_complete_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES carriers(id) ON DELETE SET NULL,
    ADD CONSTRAINT ctes_complete_freight_rate_table_id_fkey FOREIGN KEY (freight_rate_table_id) REFERENCES freight_rate_tables(id);

-- CTes Invoices
CREATE TABLE public.ctes_invoices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    cte_id uuid NOT NULL,
    invoice_key text NOT NULL,
    invoice_number text,
    invoice_value numeric(10,2),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.ctes_invoices
    ADD CONSTRAINT ctes_invoices_pkey PRIMARY KEY (id),
    ADD CONSTRAINT ctes_invoices_cte_id_fkey FOREIGN KEY (cte_id) REFERENCES ctes_complete(id) ON DELETE CASCADE;

-- CTes Carrier Costs
CREATE TABLE public.ctes_carrier_costs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    cte_id uuid NOT NULL,
    carrier_id uuid,
    cost_type text NOT NULL,
    cost_value numeric(10,2) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.ctes_carrier_costs
    ADD CONSTRAINT ctes_carrier_costs_pkey PRIMARY KEY (id),
    ADD CONSTRAINT ctes_carrier_costs_cte_id_fkey FOREIGN KEY (cte_id) REFERENCES ctes_complete(id) ON DELETE CASCADE,
    ADD CONSTRAINT ctes_carrier_costs_carrier_id_fkey FOREIGN KEY (carrier_id) REFERENCES carriers(id);

-- ============================================
-- FREIGHT QUOTES AND PICKUPS
-- ============================================

-- Pickups
CREATE TABLE public.pickups (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    pickup_number text NOT NULL,
    customer_id uuid,
    scheduled_date timestamp with time zone,
    status text NOT NULL,
    address text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.pickups
    ADD CONSTRAINT pickups_pkey PRIMARY KEY (id),
    ADD CONSTRAINT pickups_pickup_number_key UNIQUE (pickup_number),
    ADD CONSTRAINT pickups_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT pickups_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT pickups_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES business_partners(id),
    ADD CONSTRAINT pickups_status_check CHECK (status = ANY (ARRAY['Emitida'::text, 'Solicitada'::text, 'Realizada'::text, 'Cancelada'::text]));

-- Freight Quotes
CREATE TABLE public.freight_quotes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    quote_number text NOT NULL,
    customer_id uuid,
    origin_city text,
    destination_city text,
    weight numeric(10,2),
    value numeric(10,2),
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.freight_quotes
    ADD CONSTRAINT freight_quotes_pkey PRIMARY KEY (id),
    ADD CONSTRAINT freight_quotes_quote_number_key UNIQUE (quote_number),
    ADD CONSTRAINT freight_quotes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES business_partners(id),
    ADD CONSTRAINT freight_quotes_status_check CHECK (status = ANY (ARRAY['pending'::text, 'quoted'::text, 'approved'::text, 'rejected'::text, 'expired'::text]));

-- Freight Quotes History
CREATE TABLE public.freight_quotes_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    quote_number integer NOT NULL DEFAULT nextval('freight_quotes_history_quote_number_seq'::regclass),
    user_id uuid,
    establishment_id uuid,
    business_partner_id uuid,
    origin_city_id integer,
    destination_city_id integer,
    weight numeric(10,2) NOT NULL,
    cargo_value numeric(10,2) NOT NULL,
    volume_qty integer NOT NULL,
    cubic_meters numeric(10,4),
    selected_modals text[],
    best_carrier_id uuid,
    best_quote_value numeric(10,2),
    delivery_days integer,
    quote_details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.freight_quotes_history
    ADD CONSTRAINT freight_quotes_history_pkey PRIMARY KEY (id),
    ADD CONSTRAINT freight_quotes_history_quote_number_key UNIQUE (quote_number),
    ADD CONSTRAINT freight_quotes_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT freight_quotes_history_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE SET NULL,
    ADD CONSTRAINT freight_quotes_history_business_partner_id_fkey FOREIGN KEY (business_partner_id) REFERENCES business_partners(id) ON DELETE SET NULL,
    ADD CONSTRAINT freight_quotes_history_origin_city_id_fkey FOREIGN KEY (origin_city_id) REFERENCES cities(id) ON DELETE SET NULL,
    ADD CONSTRAINT freight_quotes_history_destination_city_id_fkey FOREIGN KEY (destination_city_id) REFERENCES cities(id) ON DELETE SET NULL,
    ADD CONSTRAINT freight_quotes_history_best_carrier_id_fkey FOREIGN KEY (best_carrier_id) REFERENCES carriers(id) ON DELETE SET NULL,
    ADD CONSTRAINT freight_quotes_history_weight_check CHECK (weight > 0::numeric),
    ADD CONSTRAINT freight_quotes_history_cargo_value_check CHECK (cargo_value > 0::numeric),
    ADD CONSTRAINT freight_quotes_history_volume_qty_check CHECK (volume_qty > 0),
    ADD CONSTRAINT freight_quotes_history_cubic_meters_check CHECK ((cubic_meters IS NULL) OR (cubic_meters > 0::numeric)),
    ADD CONSTRAINT freight_quotes_history_delivery_days_check CHECK ((delivery_days IS NULL) OR (delivery_days >= 0));

-- ============================================
-- REVERSE LOGISTICS
-- ============================================

-- Reverse Logistics
CREATE TABLE public.reverse_logistics (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    reverse_order_number text NOT NULL,
    original_order_id uuid,
    customer_id uuid,
    type text NOT NULL,
    reason text,
    status text NOT NULL,
    priority text DEFAULT 'medium'::text,
    requested_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.reverse_logistics
    ADD CONSTRAINT reverse_logistics_pkey PRIMARY KEY (id),
    ADD CONSTRAINT reverse_logistics_reverse_order_number_key UNIQUE (reverse_order_number),
    ADD CONSTRAINT reverse_logistics_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT reverse_logistics_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT reverse_logistics_original_order_id_fkey FOREIGN KEY (original_order_id) REFERENCES orders(id),
    ADD CONSTRAINT reverse_logistics_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES business_partners(id),
    ADD CONSTRAINT reverse_logistics_type_check CHECK (type = ANY (ARRAY['exchange'::text, 'return'::text, 'warranty'::text, 'defect'::text])),
    ADD CONSTRAINT reverse_logistics_status_check CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'in_transit'::text, 'received'::text, 'processed'::text, 'completed'::text, 'rejected'::text, 'cancelled'::text])),
    ADD CONSTRAINT reverse_logistics_priority_check CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]));

-- Reverse Logistics Items
CREATE TABLE public.reverse_logistics_items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    reverse_logistics_id uuid NOT NULL,
    product_code text,
    product_name text NOT NULL,
    quantity integer NOT NULL,
    condition text NOT NULL,
    action text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.reverse_logistics_items
    ADD CONSTRAINT reverse_logistics_items_pkey PRIMARY KEY (id),
    ADD CONSTRAINT reverse_logistics_items_reverse_logistics_id_fkey FOREIGN KEY (reverse_logistics_id) REFERENCES reverse_logistics(id) ON DELETE CASCADE,
    ADD CONSTRAINT reverse_logistics_items_condition_check CHECK (condition = ANY (ARRAY['new'::text, 'used'::text, 'damaged'::text, 'defective'::text])),
    ADD CONSTRAINT reverse_logistics_items_action_check CHECK (action = ANY (ARRAY['refund'::text, 'exchange'::text, 'repair'::text, 'discard'::text]));

-- ============================================
-- NPS (Net Promoter Score) TABLES
-- ============================================

-- NPS Config
CREATE TABLE public.nps_config (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    estabelecimento_id uuid NOT NULL,
    ativo boolean DEFAULT true,
    dias_apos_entrega integer DEFAULT 2,
    periodicidade_calculo text DEFAULT 'mensal'::text,
    pesos_criterios jsonb DEFAULT '{"pontualidade": 0.40, "ocorrencias": 0.30, "comunicacao": 0.15, "pod": 0.15}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.nps_config
    ADD CONSTRAINT nps_config_pkey PRIMARY KEY (id),
    ADD CONSTRAINT nps_config_estabelecimento_id_key UNIQUE (estabelecimento_id),
    ADD CONSTRAINT nps_config_estabelecimento_id_fkey FOREIGN KEY (estabelecimento_id) REFERENCES establishments(id) ON DELETE CASCADE,
    ADD CONSTRAINT nps_config_periodicidade_calculo_check CHECK (periodicidade_calculo = ANY (ARRAY['semanal'::text, 'quinzenal'::text, 'mensal'::text]));

-- NPS Internal Evaluations
CREATE TABLE public.nps_avaliacoes_internas (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    estabelecimento_id uuid NOT NULL,
    transportador_id uuid NOT NULL,
    periodo_inicio date NOT NULL,
    periodo_fim date NOT NULL,
    nota_pontualidade numeric(4,2),
    nota_ocorrencias numeric(4,2),
    nota_comunicacao numeric(4,2),
    nota_pod numeric(4,2),
    nota_final numeric(4,2) NOT NULL,
    total_entregas integer,
    entregas_no_prazo integer,
    entregas_com_ocorrencia integer,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.nps_avaliacoes_internas
    ADD CONSTRAINT nps_avaliacoes_internas_pkey PRIMARY KEY (id),
    ADD CONSTRAINT nps_avaliacoes_internas_estabelecimento_id_fkey FOREIGN KEY (estabelecimento_id) REFERENCES establishments(id) ON DELETE CASCADE,
    ADD CONSTRAINT nps_avaliacoes_internas_transportador_id_fkey FOREIGN KEY (transportador_id) REFERENCES carriers(id) ON DELETE CASCADE,
    ADD CONSTRAINT nps_avaliacoes_internas_nota_final_check CHECK ((nota_final >= 0::numeric) AND (nota_final <= 10::numeric));

-- NPS Customer Surveys
CREATE TABLE public.nps_pesquisas_cliente (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    estabelecimento_id uuid NOT NULL,
    pedido_id uuid NOT NULL,
    transportador_id uuid NOT NULL,
    cliente_nome text NOT NULL,
    cliente_contato text NOT NULL,
    canal_envio text NOT NULL,
    data_envio timestamp with time zone,
    data_resposta timestamp with time zone,
    nota integer,
    comentario text,
    status text DEFAULT 'pendente'::text,
    token_pesquisa text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.nps_pesquisas_cliente
    ADD CONSTRAINT nps_pesquisas_cliente_pkey PRIMARY KEY (id),
    ADD CONSTRAINT nps_pesquisas_cliente_estabelecimento_id_fkey FOREIGN KEY (estabelecimento_id) REFERENCES establishments(id) ON DELETE CASCADE,
    ADD CONSTRAINT nps_pesquisas_cliente_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES orders(id) ON DELETE CASCADE,
    ADD CONSTRAINT nps_pesquisas_cliente_transportador_id_fkey FOREIGN KEY (transportador_id) REFERENCES carriers(id) ON DELETE CASCADE,
    ADD CONSTRAINT nps_pesquisas_cliente_canal_envio_check CHECK (canal_envio = ANY (ARRAY['whatsapp'::text, 'email'::text])),
    ADD CONSTRAINT nps_pesquisas_cliente_status_check CHECK (status = ANY (ARRAY['pendente'::text, 'respondida'::text, 'expirada'::text])),
    ADD CONSTRAINT nps_pesquisas_cliente_nota_check CHECK ((nota >= 0) AND (nota <= 10));

-- NPS Send History
CREATE TABLE public.nps_historico_envios (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    pesquisa_id uuid NOT NULL,
    canal text NOT NULL,
    destinatario text NOT NULL,
    status_envio text NOT NULL,
    detalhes_envio jsonb,
    data_envio timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.nps_historico_envios
    ADD CONSTRAINT nps_historico_envios_pkey PRIMARY KEY (id),
    ADD CONSTRAINT nps_historico_envios_pesquisa_id_fkey FOREIGN KEY (pesquisa_id) REFERENCES nps_pesquisas_cliente(id) ON DELETE CASCADE,
    ADD CONSTRAINT nps_historico_envios_status_envio_check CHECK (status_envio = ANY (ARRAY['enviado'::text, 'falha'::text, 'pendente'::text]));

-- ============================================
-- CHANGE LOGS AND AUDIT
-- ============================================

-- Change Logs
CREATE TABLE public.change_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    entity_type text NOT NULL,
    entity_id text NOT NULL,
    action_type text NOT NULL,
    user_id text,
    changes jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.change_logs
    ADD CONSTRAINT change_logs_pkey PRIMARY KEY (id),
    ADD CONSTRAINT change_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT change_logs_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT change_logs_action_type_check CHECK (action_type = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text]));

-- ============================================
-- CONFIGURATION TABLES
-- ============================================

-- API Keys Config
CREATE TABLE public.api_keys_config (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    estabelecimento_id uuid NOT NULL,
    key_type text NOT NULL,
    api_key text NOT NULL,
    environment text NOT NULL,
    is_active boolean DEFAULT true,
    monthly_quota integer,
    current_usage integer DEFAULT 0,
    usage_reset_day integer DEFAULT 1,
    alert_threshold_percent integer DEFAULT 80,
    expires_at timestamp with time zone,
    auto_rotate boolean DEFAULT false,
    rotation_interval_days integer,
    next_rotation_date timestamp with time zone,
    rotated_at timestamp with time zone,
    rotated_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.api_keys_config
    ADD CONSTRAINT api_keys_config_pkey PRIMARY KEY (id),
    ADD CONSTRAINT api_keys_config_key_type_check CHECK (key_type = ANY (ARRAY['google_maps'::text, 'recaptcha_site'::text, 'recaptcha_secret'::text, 'openai'::text, 'whatsapp'::text, 'supabase_service_role'::text, 'smtp'::text, 'custom'::text])),
    ADD CONSTRAINT api_keys_config_environment_check CHECK (environment = ANY (ARRAY['production'::text, 'staging'::text, 'development'::text])),
    ADD CONSTRAINT api_keys_config_usage_reset_day_check CHECK ((usage_reset_day >= 1) AND (usage_reset_day <= 28)),
    ADD CONSTRAINT api_keys_config_alert_threshold_percent_check CHECK ((alert_threshold_percent >= 0) AND (alert_threshold_percent <= 100));

-- API Keys Rotation History
CREATE TABLE public.api_keys_rotation_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    key_config_id uuid NOT NULL,
    old_key_hash text NOT NULL,
    new_key_hash text NOT NULL,
    rotated_by uuid,
    rotation_type text NOT NULL,
    rotation_reason text,
    rotated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.api_keys_rotation_history
    ADD CONSTRAINT api_keys_rotation_history_pkey PRIMARY KEY (id),
    ADD CONSTRAINT api_keys_rotation_history_key_config_id_fkey FOREIGN KEY (key_config_id) REFERENCES api_keys_config(id) ON DELETE CASCADE,
    ADD CONSTRAINT api_keys_rotation_history_rotation_type_check CHECK (rotation_type = ANY (ARRAY['manual'::text, 'scheduled'::text, 'emergency'::text, 'expired'::text]));

-- Google Maps Config
CREATE TABLE public.google_maps_config (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    api_key text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.google_maps_config
    ADD CONSTRAINT google_maps_config_pkey PRIMARY KEY (id),
    ADD CONSTRAINT google_maps_config_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT google_maps_config_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id);

-- OpenAI Config
CREATE TABLE public.openai_config (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    api_key text NOT NULL,
    model text DEFAULT 'gpt-4'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.openai_config
    ADD CONSTRAINT openai_config_pkey PRIMARY KEY (id),
    ADD CONSTRAINT openai_config_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT openai_config_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id);

-- WhatsApp Config
CREATE TABLE public.whatsapp_config (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    api_key text NOT NULL,
    phone_number text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.whatsapp_config
    ADD CONSTRAINT whatsapp_config_pkey PRIMARY KEY (id),
    ADD CONSTRAINT whatsapp_config_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT whatsapp_config_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id);

-- Email Outgoing Config
CREATE TABLE public.email_outgoing_config (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    establishment_id uuid NOT NULL,
    smtp_host text NOT NULL,
    smtp_port integer NOT NULL,
    smtp_user text NOT NULL,
    smtp_password text NOT NULL,
    smtp_secure text DEFAULT 'TLS'::text,
    from_email text NOT NULL,
    from_name text,
    auth_type text DEFAULT 'LOGIN'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    updated_by uuid
);

ALTER TABLE ONLY public.email_outgoing_config
    ADD CONSTRAINT email_outgoing_config_pkey PRIMARY KEY (id),
    ADD CONSTRAINT email_outgoing_config_establishment_id_key UNIQUE (establishment_id),
    ADD CONSTRAINT email_outgoing_config_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT email_outgoing_config_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT email_outgoing_config_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE CASCADE,
    ADD CONSTRAINT email_outgoing_config_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT email_outgoing_config_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT email_outgoing_config_smtp_secure_check CHECK (smtp_secure = ANY (ARRAY['TLS'::text, 'SSL'::text, 'NONE'::text])),
    ADD CONSTRAINT email_outgoing_config_auth_type_check CHECK (auth_type = ANY (ARRAY['LOGIN'::text, 'OAuth2'::text]));

-- ============================================
-- WHATSAPP TABLES
-- ============================================

-- WhatsApp Templates
CREATE TABLE public.whatsapp_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    template_name text NOT NULL,
    category text NOT NULL,
    language text DEFAULT 'pt_BR'::text,
    content text NOT NULL,
    variables text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.whatsapp_templates
    ADD CONSTRAINT whatsapp_templates_pkey PRIMARY KEY (id),
    ADD CONSTRAINT whatsapp_templates_template_name_key UNIQUE (template_name);

-- WhatsApp Messages Log
CREATE TABLE public.whatsapp_messages_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    recipient_phone text NOT NULL,
    message_content text NOT NULL,
    status text NOT NULL,
    template_id uuid,
    order_id uuid,
    sent_by uuid,
    sent_at timestamp with time zone DEFAULT now(),
    delivered_at timestamp with time zone,
    read_at timestamp with time zone,
    error_message text
);

ALTER TABLE ONLY public.whatsapp_messages_log
    ADD CONSTRAINT whatsapp_messages_log_pkey PRIMARY KEY (id);

-- WhatsApp Transactions
CREATE TABLE public.whatsapp_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    establishment_id uuid,
    business_partner_id uuid,
    transaction_type text NOT NULL,
    message_type text NOT NULL,
    phone_number text NOT NULL,
    message_content text,
    status text NOT NULL,
    message_log_id uuid,
    transaction_date timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.whatsapp_transactions
    ADD CONSTRAINT whatsapp_transactions_pkey PRIMARY KEY (id),
    ADD CONSTRAINT whatsapp_transactions_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE SET NULL,
    ADD CONSTRAINT whatsapp_transactions_business_partner_id_fkey FOREIGN KEY (business_partner_id) REFERENCES business_partners(id) ON DELETE SET NULL,
    ADD CONSTRAINT whatsapp_transactions_message_log_id_fkey FOREIGN KEY (message_log_id) REFERENCES whatsapp_messages_log(id) ON DELETE SET NULL,
    ADD CONSTRAINT whatsapp_transactions_transaction_type_check CHECK (transaction_type = ANY (ARRAY['envio'::text, 'recebimento'::text])),
    ADD CONSTRAINT whatsapp_transactions_message_type_check CHECK (message_type = ANY (ARRAY['texto'::text, 'imagem'::text, 'template'::text, 'documento'::text, 'audio'::text, 'video'::text, 'localizacao'::text])),
    ADD CONSTRAINT whatsapp_transactions_status_check CHECK (status = ANY (ARRAY['enviada'::text, 'entregue'::text, 'lida'::text, 'falha'::text, 'pendente'::text]));

-- ============================================
-- XML AUTO IMPORT
-- ============================================

-- XML Auto Import Logs
CREATE TABLE public.xml_auto_import_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    establishment_id uuid NOT NULL,
    execution_time timestamp with time zone NOT NULL,
    status text NOT NULL,
    total_xmls_found integer DEFAULT 0,
    xmls_imported integer DEFAULT 0,
    xmls_skipped integer DEFAULT 0,
    xmls_failed integer DEFAULT 0,
    error_message text,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.xml_auto_import_logs
    ADD CONSTRAINT xml_auto_import_logs_pkey PRIMARY KEY (id),
    ADD CONSTRAINT xml_auto_import_logs_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES establishments(id) ON DELETE CASCADE,
    ADD CONSTRAINT xml_auto_import_logs_status_check CHECK (status = ANY (ARRAY['success'::text, 'error'::text, 'warning'::text, 'running'::text]));

-- ============================================
-- INNOVATIONS AND SUGGESTIONS
-- ============================================

-- Innovations
CREATE TABLE public.innovations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    icon text,
    link text,
    is_active boolean DEFAULT true,
    display_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.innovations
    ADD CONSTRAINT innovations_pkey PRIMARY KEY (id),
    ADD CONSTRAINT innovations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT innovations_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id);

-- User Innovations
CREATE TABLE public.user_innovations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    innovation_id uuid NOT NULL,
    dismissed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.user_innovations
    ADD CONSTRAINT user_innovations_pkey PRIMARY KEY (id),
    ADD CONSTRAINT user_innovations_user_id_innovation_id_key UNIQUE (user_id, innovation_id),
    ADD CONSTRAINT user_innovations_innovation_id_fkey FOREIGN KEY (innovation_id) REFERENCES innovations(id) ON DELETE CASCADE;

-- Suggestions
CREATE TABLE public.suggestions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL,
    environment_id uuid NOT NULL,
    user_id uuid,
    establishment_id uuid,
    title text NOT NULL,
    description text NOT NULL,
    category text,
    priority text DEFAULT 'medium'::text,
    status text DEFAULT 'pending'::text,
    votes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.suggestions
    ADD CONSTRAINT suggestions_pkey PRIMARY KEY (id),
    ADD CONSTRAINT suggestions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT suggestions_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES environments(id),
    ADD CONSTRAINT suggestions_priority_check CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
    ADD CONSTRAINT suggestions_status_check CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'approved'::text, 'implemented'::text, 'rejected'::text]));

-- ============================================
-- DEPLOYMENT TRACKING TABLES
-- ============================================

-- Deploy Projects
CREATE TABLE public.deploy_projects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.deploy_projects
    ADD CONSTRAINT deploy_projects_pkey PRIMARY KEY (id);

-- Deploy Uploads
CREATE TABLE public.deploy_uploads (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    file_path text NOT NULL,
    file_size bigint,
    mime_type text,
    uploaded_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.deploy_uploads
    ADD CONSTRAINT deploy_uploads_pkey PRIMARY KEY (id),
    ADD CONSTRAINT deploy_uploads_project_id_fkey FOREIGN KEY (project_id) REFERENCES deploy_projects(id) ON DELETE CASCADE;

-- Deploy Interpretations
CREATE TABLE public.deploy_interpretations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    upload_id uuid NOT NULL,
    interpretation jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.deploy_interpretations
    ADD CONSTRAINT deploy_interpretations_pkey PRIMARY KEY (id),
    ADD CONSTRAINT deploy_interpretations_project_id_fkey FOREIGN KEY (project_id) REFERENCES deploy_projects(id) ON DELETE CASCADE,
    ADD CONSTRAINT deploy_interpretations_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES deploy_uploads(id) ON DELETE CASCADE;

-- Deploy Suggestions
CREATE TABLE public.deploy_suggestions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    suggestion text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.deploy_suggestions
    ADD CONSTRAINT deploy_suggestions_pkey PRIMARY KEY (id),
    ADD CONSTRAINT deploy_suggestions_project_id_fkey FOREIGN KEY (project_id) REFERENCES deploy_projects(id) ON DELETE CASCADE;

-- Deploy Executions
CREATE TABLE public.deploy_executions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    interpretation_id uuid NOT NULL,
    status text DEFAULT 'pending'::text,
    result jsonb,
    executed_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.deploy_executions
    ADD CONSTRAINT deploy_executions_pkey PRIMARY KEY (id),
    ADD CONSTRAINT deploy_executions_project_id_fkey FOREIGN KEY (project_id) REFERENCES deploy_projects(id) ON DELETE CASCADE,
    ADD CONSTRAINT deploy_executions_interpretation_id_fkey FOREIGN KEY (interpretation_id) REFERENCES deploy_interpretations(id) ON DELETE CASCADE;

-- Deploy Validations
CREATE TABLE public.deploy_validations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL,
    upload_id uuid,
    execution_id uuid,
    validation_type text NOT NULL,
    is_valid boolean NOT NULL,
    errors jsonb,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE ONLY public.deploy_validations
    ADD CONSTRAINT deploy_validations_pkey PRIMARY KEY (id),
    ADD CONSTRAINT deploy_validations_project_id_fkey FOREIGN KEY (project_id) REFERENCES deploy_projects(id) ON DELETE CASCADE,
    ADD CONSTRAINT deploy_validations_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES deploy_uploads(id),
    ADD CONSTRAINT deploy_validations_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES deploy_executions(id);

-- ============================================
-- INDEXES
-- ============================================
-- Note: Only showing a subset of key indexes due to space constraints
-- The database has 300+ indexes total

-- Organizations and Environments
CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug);
CREATE INDEX idx_organizations_domain ON public.organizations USING btree (domain);
CREATE INDEX idx_organizations_plan ON public.organizations USING btree (plan_id);
CREATE INDEX idx_environments_org ON public.environments USING btree (organization_id);
CREATE INDEX idx_environments_type ON public.environments USING btree (type);
CREATE INDEX idx_environments_active ON public.environments USING btree (is_active);

-- Users
CREATE INDEX idx_users_organization ON public.users USING btree (organization_id);
CREATE INDEX idx_users_environment ON public.users USING btree (environment_id);
CREATE INDEX idx_users_org_env ON public.users USING btree (organization_id, environment_id);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_codigo ON public.users USING btree (codigo);
CREATE INDEX idx_users_status ON public.users USING btree (status);
CREATE INDEX idx_users_perfil ON public.users USING btree (perfil);
CREATE INDEX idx_users_estabelecimento ON public.users USING btree (estabelecimento_id);
CREATE INDEX idx_users_estabelecimentos_permitidos ON public.users USING gin (estabelecimentos_permitidos);
CREATE INDEX idx_users_has_license ON public.users USING btree (has_license);
CREATE UNIQUE INDEX idx_users_license_key ON public.users USING btree (license_key) WHERE (license_key IS NOT NULL);

-- Business Partners
CREATE INDEX idx_business_partners_organization ON public.business_partners USING btree (organization_id);
CREATE INDEX idx_business_partners_environment ON public.business_partners USING btree (environment_id);
CREATE INDEX idx_business_partners_org_env ON public.business_partners USING btree (organization_id, environment_id);
CREATE INDEX idx_business_partners_document ON public.business_partners USING btree (document);
CREATE INDEX idx_business_partners_type ON public.business_partners USING btree (type);
CREATE INDEX idx_business_partners_status ON public.business_partners USING btree (status);

-- Carriers
CREATE INDEX idx_carriers_organization ON public.carriers USING btree (organization_id);
CREATE INDEX idx_carriers_environment ON public.carriers USING btree (environment_id);
CREATE INDEX idx_carriers_org_env ON public.carriers USING btree (organization_id, environment_id);
CREATE INDEX idx_carriers_codigo ON public.carriers USING btree (codigo);
CREATE INDEX idx_carriers_cnpj ON public.carriers USING btree (cnpj);
CREATE INDEX idx_carriers_status ON public.carriers USING btree (status);

-- Cities and Geography
CREATE INDEX cities_ibge_code_idx ON public.cities USING btree (ibge_code);
CREATE INDEX cities_state_abbreviation_idx ON public.cities USING btree (state_abbreviation);
CREATE INDEX cities_region_idx ON public.cities USING btree (region);
CREATE INDEX idx_cities_name ON public.cities USING btree (name);
CREATE INDEX idx_cities_zip_code_start ON public.cities USING btree (zip_code_start);
CREATE INDEX idx_cities_zip_code_end ON public.cities USING btree (zip_code_end);

-- Orders
CREATE INDEX idx_orders_organization ON public.orders USING btree (organization_id);
CREATE INDEX idx_orders_environment ON public.orders USING btree (environment_id);
CREATE INDEX idx_orders_org_env ON public.orders USING btree (organization_id, environment_id);
CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at DESC);

-- Invoices
CREATE INDEX idx_invoices_organization_id ON public.invoices USING btree (organization_id);
CREATE INDEX idx_invoices_environment_id ON public.invoices USING btree (environment_id);
CREATE INDEX idx_invoices_org_env ON public.invoices USING btree (organization_id, environment_id);
CREATE INDEX idx_invoices_invoice_number ON public.invoices USING btree (invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);
CREATE INDEX idx_invoices_created_at ON public.invoices USING btree (created_at DESC);

-- Invoices NFe
CREATE INDEX idx_invoices_nfe_organization_id ON public.invoices_nfe USING btree (organization_id);
CREATE INDEX idx_invoices_nfe_environment_id ON public.invoices_nfe USING btree (environment_id);
CREATE INDEX idx_invoices_nfe_org_env ON public.invoices_nfe USING btree (organization_id, environment_id);
CREATE INDEX idx_invoices_nfe_access_key ON public.invoices_nfe USING btree (access_key);
CREATE INDEX idx_invoices_nfe_establishment ON public.invoices_nfe USING btree (establishment_id);
CREATE INDEX idx_invoices_nfe_issue_date ON public.invoices_nfe USING btree (issue_date);

-- Freight Rates
CREATE INDEX idx_freight_rate_tables_organization ON public.freight_rate_tables USING btree (organization_id);
CREATE INDEX idx_freight_rate_tables_environment ON public.freight_rate_tables USING btree (environment_id);
CREATE INDEX idx_freight_rate_tables_org_env ON public.freight_rate_tables USING btree (organization_id, environment_id);
CREATE INDEX idx_freight_rate_tables_transportador ON public.freight_rate_tables USING btree (transportador_id);
CREATE INDEX idx_freight_rate_tables_status ON public.freight_rate_tables USING btree (status);

CREATE INDEX idx_freight_rates_organization ON public.freight_rates USING btree (organization_id);
CREATE INDEX idx_freight_rates_environment ON public.freight_rates USING btree (environment_id);
CREATE INDEX idx_freight_rates_org_env ON public.freight_rates USING btree (organization_id, environment_id);
CREATE INDEX idx_freight_rates_table_id ON public.freight_rates USING btree (freight_rate_table_id);
CREATE INDEX idx_freight_rates_codigo ON public.freight_rates USING btree (codigo);

-- Freight Quotes History
CREATE INDEX idx_freight_quotes_history_created_at ON public.freight_quotes_history USING btree (created_at DESC);
CREATE INDEX idx_freight_quotes_history_user_id ON public.freight_quotes_history USING btree (user_id);
CREATE INDEX idx_freight_quotes_history_establishment ON public.freight_quotes_history USING btree (establishment_id);
CREATE INDEX idx_freight_quotes_history_quote_number ON public.freight_quotes_history USING btree (quote_number);
CREATE INDEX idx_freight_quotes_history_selected_modals ON public.freight_quotes_history USING gin (selected_modals);

-- Change Logs
CREATE INDEX idx_change_logs_organization ON public.change_logs USING btree (organization_id);
CREATE INDEX idx_change_logs_environment ON public.change_logs USING btree (environment_id);
CREATE INDEX idx_change_logs_org_env ON public.change_logs USING btree (organization_id, environment_id);
CREATE INDEX idx_change_logs_entity_type ON public.change_logs USING btree (entity_type);
CREATE INDEX idx_change_logs_entity_id ON public.change_logs USING btree (entity_id);
CREATE INDEX idx_change_logs_created_at ON public.change_logs USING btree (created_at DESC);

-- ============================================
-- RLS (Row Level Security) POLICIES
-- ============================================
-- Note: Showing key RLS policies for multi-tenancy

-- Enable RLS on all tenant-scoped tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_nfe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_rate_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saas_admins ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY organizations_isolation_select ON public.organizations FOR SELECT TO anon
    USING (id = get_session_organization_id());

CREATE POLICY organizations_isolation_insert ON public.organizations FOR INSERT TO anon
    WITH CHECK (id = get_session_organization_id());

CREATE POLICY organizations_isolation_update ON public.organizations FOR UPDATE TO anon
    USING (id = get_session_organization_id())
    WITH CHECK (id = get_session_organization_id());

CREATE POLICY organizations_isolation_delete ON public.organizations FOR DELETE TO anon
    USING (id = get_session_organization_id());

-- Environments policies
CREATE POLICY environments_select_anon ON public.environments FOR SELECT TO anon
    USING (is_global_admin_user() OR (get_session_organization_id() IS NULL) OR (organization_id = get_session_organization_id()));

CREATE POLICY environments_insert_anon ON public.environments FOR INSERT TO anon
    WITH CHECK ((get_session_organization_id() IS NULL) OR (organization_id = get_session_organization_id()));

CREATE POLICY environments_update_anon ON public.environments FOR UPDATE TO anon
    USING ((get_session_organization_id() IS NULL) OR (organization_id = get_session_organization_id()))
    WITH CHECK ((get_session_organization_id() IS NULL) OR (organization_id = get_session_organization_id()));

CREATE POLICY environments_delete_anon ON public.environments FOR DELETE TO anon
    USING ((get_session_organization_id() IS NULL) OR (organization_id = get_session_organization_id()));

-- Generic org+env isolation policies for multi-tenant tables
-- Users
CREATE POLICY users_isolation_select ON public.users FOR SELECT TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY users_isolation_insert ON public.users FOR INSERT TO anon
    WITH CHECK ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY users_isolation_update ON public.users FOR UPDATE TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()))
    WITH CHECK ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY users_isolation_delete ON public.users FOR DELETE TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

-- Business Partners
CREATE POLICY business_partners_isolation_select ON public.business_partners FOR SELECT TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY business_partners_isolation_insert ON public.business_partners FOR INSERT TO anon
    WITH CHECK ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY business_partners_isolation_update ON public.business_partners FOR UPDATE TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()))
    WITH CHECK ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY business_partners_isolation_delete ON public.business_partners FOR DELETE TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

-- Carriers
CREATE POLICY carriers_isolation_select ON public.carriers FOR SELECT TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY carriers_isolation_insert ON public.carriers FOR INSERT TO anon
    WITH CHECK ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY carriers_isolation_update ON public.carriers FOR UPDATE TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()))
    WITH CHECK ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY carriers_isolation_delete ON public.carriers FOR DELETE TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

-- Orders
CREATE POLICY orders_isolation_select ON public.orders FOR SELECT TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY orders_isolation_insert ON public.orders FOR INSERT TO anon
    WITH CHECK ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY orders_isolation_update ON public.orders FOR UPDATE TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()))
    WITH CHECK ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY orders_isolation_delete ON public.orders FOR DELETE TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

-- Invoices NFe (with both anon and authenticated policies)
CREATE POLICY invoices_nfe_isolation_select ON public.invoices_nfe FOR SELECT TO anon
    USING ((organization_id = get_session_organization_id()) AND (environment_id = get_session_environment_id()));

CREATE POLICY "Users can view invoices_nfe from their organization and environ" ON public.invoices_nfe FOR SELECT TO authenticated
    USING ((organization_id::text = current_setting('app.current_organization_id', true)) AND (environment_id::text = current_setting('app.current_environment_id', true)));

-- SaaS Admins
CREATE POLICY saas_admins_select_policy ON public.saas_admins FOR SELECT TO anon
    USING (is_saas_admin());

CREATE POLICY saas_admins_insert_policy ON public.saas_admins FOR INSERT TO anon
    WITH CHECK (is_saas_admin());

CREATE POLICY saas_admins_update_policy ON public.saas_admins FOR UPDATE TO anon
    USING (is_saas_admin())
    WITH CHECK (is_saas_admin());

CREATE POLICY saas_admins_delete_policy ON public.saas_admins FOR DELETE TO anon
    USING (is_saas_admin());

-- Note: Additional RLS policies exist for all other tables following similar patterns

-- ============================================
-- FUNCTIONS
-- ============================================
-- Note: Showing key functions only. Full database has 40+ functions.

-- Session context functions
CREATE OR REPLACE FUNCTION public.get_session_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN current_setting('app.organization_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_session_environment_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN current_setting('app.environment_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_saas_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN COALESCE(
        (SELECT raw_app_meta_data->>'is_saas_admin' = 'true'
         FROM auth.users
         WHERE id = auth.uid()),
        false
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_global_admin_user()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM users
        WHERE email = 'admin@gruposmartlog.com.br'
        AND perfil = 'administrador'
        AND status = 'ativo'
        AND email = current_setting('request.jwt.claims', true)::json->>'email'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================
-- Note: Showing key triggers only. Full database has 20+ triggers.

-- Organizations
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Environments
CREATE TRIGGER update_environments_updated_at
    BEFORE UPDATE ON public.environments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Establishments
CREATE TRIGGER update_establishments_updated_at
    BEFORE UPDATE ON public.establishments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Carriers
CREATE TRIGGER update_carriers_updated_at
    BEFORE UPDATE ON public.carriers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Cities
CREATE TRIGGER update_cities_updated_at
    BEFORE UPDATE ON public.cities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- States
CREATE TRIGGER states_updated_at
    BEFORE UPDATE ON public.states
    FOR EACH ROW
    EXECUTE FUNCTION update_states_updated_at();

-- Countries
CREATE TRIGGER countries_updated_at
    BEFORE UPDATE ON public.countries
    FOR EACH ROW
    EXECUTE FUNCTION update_countries_updated_at();

-- API Keys Config
CREATE TRIGGER trigger_update_api_keys_config_updated_at
    BEFORE UPDATE ON public.api_keys_config
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_config_updated_at();

CREATE TRIGGER trigger_log_api_key_rotation
    BEFORE UPDATE ON public.api_keys_config
    FOR EACH ROW
    EXECUTE FUNCTION log_api_key_rotation();

-- SaaS Admin Users
CREATE TRIGGER update_saas_admin_users_updated_at
    BEFORE UPDATE ON public.saas_admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- SaaS Plans
CREATE TRIGGER update_saas_plans_updated_at
    BEFORE UPDATE ON public.saas_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Organization Settings
CREATE TRIGGER update_organization_settings_updated_at
    BEFORE UPDATE ON public.organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Occurrences
CREATE TRIGGER occurrences_updated_at
    BEFORE UPDATE ON public.occurrences
    FOR EACH ROW
    EXECUTE FUNCTION update_occurrences_updated_at();

-- Rejection Reasons
CREATE TRIGGER rejection_reasons_updated_at
    BEFORE UPDATE ON public.rejection_reasons
    FOR EACH ROW
    EXECUTE FUNCTION update_rejection_reasons_updated_at();

-- Suggestions
CREATE TRIGGER suggestions_updated_at_trigger
    BEFORE UPDATE ON public.suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_suggestions_updated_at();

-- Licenses
CREATE TRIGGER trigger_update_licenses_updated_at
    BEFORE UPDATE ON public.licenses
    FOR EACH ROW
    EXECUTE FUNCTION update_licenses_updated_at();

-- Email Outgoing Config
CREATE TRIGGER update_email_outgoing_config_timestamp
    BEFORE UPDATE ON public.email_outgoing_config
    FOR EACH ROW
    EXECUTE FUNCTION update_email_outgoing_config_updated_at();

-- Zip Code Ranges
CREATE TRIGGER update_zip_code_ranges_updated_at
    BEFORE UPDATE ON public.zip_code_ranges
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Environment trigger to create default establishment
CREATE TRIGGER trigger_create_default_establishment
    AFTER INSERT ON public.environments
    FOR EACH ROW
    EXECUTE FUNCTION create_default_establishment_for_environment();

-- ============================================
-- COMMENTS
-- ============================================
-- Add table comments for documentation

COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations using the TMS system';
COMMENT ON TABLE public.environments IS 'Environment isolation (production, staging, etc.) per organization';
COMMENT ON TABLE public.users IS 'System users with role-based access control';
COMMENT ON TABLE public.establishments IS 'Physical establishments (headquarters, branches) per organization';
COMMENT ON TABLE public.business_partners IS 'Customers, suppliers, or both';
COMMENT ON TABLE public.carriers IS 'Transport carriers with performance tracking';
COMMENT ON TABLE public.freight_rate_tables IS 'Freight rate tables with validity periods';
COMMENT ON TABLE public.orders IS 'Transport orders with tracking';
COMMENT ON TABLE public.invoices_nfe IS 'Brazilian electronic invoices (NF-e)';
COMMENT ON TABLE public.ctes_complete IS 'Brazilian electronic transport documents (CT-e)';
COMMENT ON TABLE public.nps_config IS 'Net Promoter Score configuration per establishment';
COMMENT ON TABLE public.api_keys_config IS 'API key management with rotation tracking';

-- ============================================
-- END OF SCHEMA
-- ============================================
