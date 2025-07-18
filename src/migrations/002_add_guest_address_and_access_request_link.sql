-- Add address field to guests table and link access_requests to guests
-- This migration supports the automated guest creation workflow

-- Add address field to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS address TEXT;

-- Add guest_id field to access_requests table to link approved requests to created guests
ALTER TABLE access_requests ADD COLUMN IF NOT EXISTS guest_id UUID REFERENCES guests(id);

-- Create index for the new guest_id foreign key
CREATE INDEX IF NOT EXISTS idx_access_requests_guest_id ON access_requests(guest_id) WHERE guest_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN guests.address IS 'Home address of the guest (encrypted for privacy)';
COMMENT ON COLUMN access_requests.guest_id IS 'Reference to the guest record created when this access request was approved';
