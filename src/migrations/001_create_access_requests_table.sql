-- Create access_requests table for guest access request system
-- This table stores requests from potential guests who want access to the wedding website

CREATE TABLE IF NOT EXISTS access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL, -- Encrypted
  address TEXT NOT NULL, -- Encrypted
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  admin_notes TEXT,
  invitation_code TEXT UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_created_at ON access_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_invitation_code ON access_requests(invitation_code) WHERE invitation_code IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_access_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_access_requests_updated_at
  BEFORE UPDATE ON access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_access_requests_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated admin users can view access requests
CREATE POLICY "Admin users can view all access requests" ON access_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.is_active = true
    )
  );

-- Policy: Only authenticated admin users can insert access requests (for admin creation)
CREATE POLICY "Admin users can insert access requests" ON access_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.is_active = true
    )
  );

-- Policy: Only authenticated admin users can update access requests
CREATE POLICY "Admin users can update access requests" ON access_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.is_active = true
    )
  );

-- Policy: Only authenticated admin users can delete access requests
CREATE POLICY "Admin users can delete access requests" ON access_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.is_active = true
    )
  );

-- Grant necessary permissions to authenticated users (for API access)
GRANT SELECT, INSERT, UPDATE, DELETE ON access_requests TO authenticated;
GRANT USAGE ON SEQUENCE access_requests_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE access_requests IS 'Stores access requests from potential guests who want to access the wedding website';
COMMENT ON COLUMN access_requests.name IS 'Full name of the person requesting access';
COMMENT ON COLUMN access_requests.email IS 'Email address of the requester';
COMMENT ON COLUMN access_requests.phone IS 'Phone number (encrypted for privacy)';
COMMENT ON COLUMN access_requests.address IS 'Home address (encrypted for privacy)';
COMMENT ON COLUMN access_requests.message IS 'Optional message from the requester to the couple';
COMMENT ON COLUMN access_requests.status IS 'Current status: pending, approved, or denied';
COMMENT ON COLUMN access_requests.admin_notes IS 'Internal notes from admin about the request';
COMMENT ON COLUMN access_requests.invitation_code IS 'Generated invitation code when approved';
COMMENT ON COLUMN access_requests.invitation_sent_at IS 'Timestamp when invitation email was sent';
COMMENT ON COLUMN access_requests.approved_by IS 'Admin user who approved the request';
COMMENT ON COLUMN access_requests.approved_at IS 'Timestamp when request was approved';
