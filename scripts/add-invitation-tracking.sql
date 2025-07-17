-- Add invitation tracking to guests table
-- This migration adds the invitation_sent_at field to track when digital invitations were sent

-- Add invitation_sent_at column to guests table
ALTER TABLE guests 
ADD COLUMN invitation_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for better query performance when filtering by invitation status
CREATE INDEX idx_guests_invitation_sent_at ON guests(invitation_sent_at);

-- Add comment to document the field
COMMENT ON COLUMN guests.invitation_sent_at IS 'Timestamp when digital invitation email was last sent to this guest';

-- Update the updated_at trigger to include the new column (if using triggers)
-- This ensures the updated_at field is automatically updated when invitation_sent_at changes
-- Note: This assumes you have an update_updated_at_column() function and trigger already set up

-- Optional: Create a view for invitation status reporting
CREATE OR REPLACE VIEW guest_invitation_status AS
SELECT 
    g.id,
    g.first_name,
    g.last_name,
    g.email,
    g.invitation_code,
    g.invitation_sent_at,
    CASE 
        WHEN g.invitation_sent_at IS NULL THEN 'not_sent'
        WHEN g.invitation_sent_at IS NOT NULL AND g.rsvp_status = 'pending' THEN 'sent_pending'
        WHEN g.invitation_sent_at IS NOT NULL AND g.rsvp_status IN ('attending', 'not_attending') THEN 'sent_responded'
        ELSE 'unknown'
    END as invitation_status,
    g.rsvp_status,
    g.created_at,
    g.updated_at
FROM guests g
WHERE g.email IS NOT NULL; -- Only include guests with email addresses

-- Grant appropriate permissions (adjust as needed for your setup)
-- GRANT SELECT ON guest_invitation_status TO authenticated;
-- GRANT ALL ON guest_invitation_status TO service_role;

-- Example queries for testing:

-- Count guests by invitation status
-- SELECT invitation_status, COUNT(*) 
-- FROM guest_invitation_status 
-- GROUP BY invitation_status;

-- Find guests who haven't received invitations yet
-- SELECT first_name, last_name, email 
-- FROM guest_invitation_status 
-- WHERE invitation_status = 'not_sent';

-- Find guests who received invitations but haven't responded
-- SELECT first_name, last_name, email, invitation_sent_at
-- FROM guest_invitation_status 
-- WHERE invitation_status = 'sent_pending'
-- ORDER BY invitation_sent_at DESC;
