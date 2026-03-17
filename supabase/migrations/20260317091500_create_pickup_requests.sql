CREATE TABLE IF NOT EXISTS pickup_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID,
  environment_id UUID,
  pickup_id UUID NOT NULL REFERENCES pickups(id) ON DELETE CASCADE,
  request_number VARCHAR(50) NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requested_by UUID,
  requested_by_name VARCHAR(255),
  notification_method VARCHAR(50),
  carrier_email VARCHAR(255),
  carrier_phone VARCHAR(50),
  email_sent BOOLEAN DEFAULT FALSE,
  whatsapp_sent BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on pickup_requests" ON pickup_requests
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
