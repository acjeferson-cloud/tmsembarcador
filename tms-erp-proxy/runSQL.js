import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  const sql = `
    CREATE TABLE IF NOT EXISTS public.tax_exception_groups (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
      carrier_id UUID REFERENCES public.carriers(id) ON DELETE CASCADE,
      name VARCHAR NOT NULL,
      type VARCHAR NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.tax_exception_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      group_id UUID REFERENCES public.tax_exception_groups(id) ON DELETE CASCADE,
      document VARCHAR NOT NULL,
      name VARCHAR,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tax_exception_members_document ON public.tax_exception_members(document);
    CREATE INDEX IF NOT EXISTS idx_tax_exception_members_group_id ON public.tax_exception_members(group_id);
    
    ALTER TABLE public.freight_table_taxes ADD COLUMN IF NOT EXISTS exception_group_id UUID REFERENCES public.tax_exception_groups(id) ON DELETE SET NULL;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  if (error) {
    console.error('RPC failed:', error);
  } else {
    console.log('Success:', data);
  }
}

runSQL();
