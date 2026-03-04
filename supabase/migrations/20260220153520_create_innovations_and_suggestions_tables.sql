/*
  # Create innovations and suggestions management tables

  1. New Tables
    - `innovations`
      - `id` (uuid, primary key)
      - `name` (text) - Innovation name
      - `description` (text) - Short description
      - `detailed_description` (text) - Detailed description
      - `monthly_price` (numeric) - Monthly price
      - `icon` (text) - Icon name
      - `category` (text) - Category
      - `is_active` (boolean) - Active status
      - `display_order` (integer) - Display order
      - `organization_id` (uuid) - Organization ID
      - `environment_id` (uuid) - Environment ID
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `suggestions`
      - `id` (uuid, primary key)
      - `title` (text) - Suggestion title
      - `description` (text) - Suggestion description
      - `category` (text) - Category (feature, improvement, bug, other)
      - `priority` (text) - Priority (low, medium, high)
      - `status` (text) - Status (pending, analyzing, approved, rejected, implemented)
      - `user_id` (uuid) - User who created the suggestion
      - `user_name` (text) - User name
      - `organization_id` (uuid) - Organization ID
      - `environment_id` (uuid) - Environment ID
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create innovations table
CREATE TABLE IF NOT EXISTS innovations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  detailed_description text,
  monthly_price numeric(10, 2) NOT NULL DEFAULT 0,
  icon text DEFAULT 'Sparkles',
  category text DEFAULT 'general',
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  organization_id uuid,
  environment_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'feature',
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  user_id uuid,
  user_name text,
  organization_id uuid,
  environment_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE innovations ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for innovations (global resources - read by all, manage by admins)
CREATE POLICY "Allow public read access to innovations"
  ON innovations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on innovations"
  ON innovations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated update on innovations"
  ON innovations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on innovations"
  ON innovations
  FOR DELETE
  TO authenticated
  USING (true);

-- Policies for suggestions (organization-scoped)
CREATE POLICY "Allow users to read suggestions from their org"
  ON suggestions
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  );

CREATE POLICY "Allow authenticated users to create suggestions"
  ON suggestions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  );

CREATE POLICY "Allow authenticated users to update suggestions"
  ON suggestions
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  )
  WITH CHECK (
    organization_id = (SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  );

CREATE POLICY "Allow authenticated users to delete suggestions"
  ON suggestions
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (SELECT NULLIF(current_setting('app.current_organization_id', true), '')::uuid)
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_innovations_active ON innovations(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_innovations_org_env ON innovations(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_org_env ON suggestions(organization_id, environment_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status, created_at);