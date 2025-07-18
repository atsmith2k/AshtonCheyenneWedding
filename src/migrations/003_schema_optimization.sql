-- Schema Optimization Migration
-- This migration adds missing tables, foreign keys, indexes, and optimizes the database structure

-- ============================================================================
-- 1. CREATE MISSING TABLES
-- ============================================================================

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create email_campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  template_id UUID NOT NULL,
  recipient_filter JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create analytics_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  guest_id UUID,
  admin_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create albums table for better photo organization
CREATE TABLE IF NOT EXISTS albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_photo_id UUID,
  is_public BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- 2. ADD MISSING COLUMNS
-- ============================================================================

-- Add missing columns to guests table
ALTER TABLE guests ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS group_name TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS table_number INTEGER;

-- Add missing columns to photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- ============================================================================
-- 3. CREATE FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key constraints (with proper error handling)
DO $$ 
BEGIN
  -- messages.guest_id -> guests.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_messages_guest_id'
  ) THEN
    ALTER TABLE messages ADD CONSTRAINT fk_messages_guest_id 
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE;
  END IF;

  -- photos.uploaded_by_guest_id -> guests.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_photos_uploaded_by_guest_id'
  ) THEN
    ALTER TABLE photos ADD CONSTRAINT fk_photos_uploaded_by_guest_id 
    FOREIGN KEY (uploaded_by_guest_id) REFERENCES guests(id) ON DELETE SET NULL;
  END IF;

  -- photos.uploaded_by_admin_id -> admin_users.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_photos_uploaded_by_admin_id'
  ) THEN
    ALTER TABLE photos ADD CONSTRAINT fk_photos_uploaded_by_admin_id 
    FOREIGN KEY (uploaded_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL;
  END IF;

  -- photos.approved_by -> admin_users.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_photos_approved_by'
  ) THEN
    ALTER TABLE photos ADD CONSTRAINT fk_photos_approved_by 
    FOREIGN KEY (approved_by) REFERENCES admin_users(id) ON DELETE SET NULL;
  END IF;

  -- photos.album_id -> albums.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_photos_album_id'
  ) THEN
    ALTER TABLE photos ADD CONSTRAINT fk_photos_album_id 
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL;
  END IF;

  -- albums.cover_photo_id -> photos.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_albums_cover_photo_id'
  ) THEN
    ALTER TABLE albums ADD CONSTRAINT fk_albums_cover_photo_id 
    FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL;
  END IF;

  -- albums.created_by -> admin_users.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_albums_created_by'
  ) THEN
    ALTER TABLE albums ADD CONSTRAINT fk_albums_created_by 
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE SET NULL;
  END IF;

  -- email_campaigns.template_id -> email_templates.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_email_campaigns_template_id'
  ) THEN
    ALTER TABLE email_campaigns ADD CONSTRAINT fk_email_campaigns_template_id 
    FOREIGN KEY (template_id) REFERENCES email_templates(id) ON DELETE RESTRICT;
  END IF;

  -- email_campaigns.created_by -> admin_users.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_email_campaigns_created_by'
  ) THEN
    ALTER TABLE email_campaigns ADD CONSTRAINT fk_email_campaigns_created_by 
    FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE RESTRICT;
  END IF;

  -- analytics_events.guest_id -> guests.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_analytics_events_guest_id'
  ) THEN
    ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_events_guest_id 
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE;
  END IF;

  -- analytics_events.admin_id -> admin_users.id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_analytics_events_admin_id'
  ) THEN
    ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_events_admin_id 
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE SET NULL;
  END IF;

END $$;

-- ============================================================================
-- 4. CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Indexes for guests table
CREATE INDEX IF NOT EXISTS idx_guests_invitation_code ON guests(invitation_code);
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX IF NOT EXISTS idx_guests_group_id ON guests(group_id) WHERE group_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guests_invitation_sent_at ON guests(invitation_sent_at) WHERE invitation_sent_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email) WHERE email IS NOT NULL;

-- Indexes for messages table
CREATE INDEX IF NOT EXISTS idx_messages_guest_id ON messages(guest_id);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Indexes for photos table
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by_guest_id ON photos(uploaded_by_guest_id) WHERE uploaded_by_guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_by_admin_id ON photos(uploaded_by_admin_id) WHERE uploaded_by_admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_approved ON photos(approved);
CREATE INDEX IF NOT EXISTS idx_photos_featured ON photos(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id) WHERE album_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_approved_at ON photos(approved_at DESC) WHERE approved_at IS NOT NULL;

-- Indexes for access_requests table
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_guest_id ON access_requests(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_access_requests_approved_by ON access_requests(approved_by) WHERE approved_by IS NOT NULL;

-- Indexes for email_templates table
CREATE INDEX IF NOT EXISTS idx_email_templates_template_type ON email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_is_active ON email_templates(is_active) WHERE is_active = true;

-- Indexes for email_campaigns table
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_template_id ON email_campaigns(template_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

-- Indexes for analytics_events table
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_guest_id ON analytics_events(guest_id) WHERE guest_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_admin_id ON analytics_events(admin_id) WHERE admin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Indexes for albums table
CREATE INDEX IF NOT EXISTS idx_albums_is_public ON albums(is_public);
CREATE INDEX IF NOT EXISTS idx_albums_sort_order ON albums(sort_order);
CREATE INDEX IF NOT EXISTS idx_albums_created_by ON albums(created_by) WHERE created_by IS NOT NULL;

-- ============================================================================
-- 5. CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables that need them
DO $$
BEGIN
  -- admin_users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_admin_users_updated_at'
  ) THEN
    CREATE TRIGGER trigger_admin_users_updated_at
      BEFORE UPDATE ON admin_users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- email_campaigns table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_email_campaigns_updated_at'
  ) THEN
    CREATE TRIGGER trigger_email_campaigns_updated_at
      BEFORE UPDATE ON email_campaigns
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- albums table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_albums_updated_at'
  ) THEN
    CREATE TRIGGER trigger_albums_updated_at
      BEFORE UPDATE ON albums
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- email_templates table (if not already exists)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'trigger_email_templates_updated_at'
  ) THEN
    CREATE TRIGGER trigger_email_templates_updated_at
      BEFORE UPDATE ON email_templates
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admin users can view all admin users" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.is_active = true
    )
  );

CREATE POLICY "Admin users can update admin users" ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.is_active = true
      AND au.role = 'super_admin'
    )
  );

-- Email campaigns policies
CREATE POLICY "Admin users can manage email campaigns" ON email_campaigns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.is_active = true
    )
  );

-- Analytics events policies
CREATE POLICY "Admin users can view analytics events" ON analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.is_active = true
    )
  );

-- Albums policies
CREATE POLICY "Admin users can manage albums" ON albums
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.email = auth.jwt() ->> 'email'
      AND au.is_active = true
    )
  );

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON admin_users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON albums TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

-- Table comments
COMMENT ON TABLE admin_users IS 'Administrative users who can manage the wedding website';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns sent to guests';
COMMENT ON TABLE analytics_events IS 'Analytics and tracking events for user behavior';
COMMENT ON TABLE albums IS 'Photo albums for organizing wedding photos';

-- Column comments for admin_users
COMMENT ON COLUMN admin_users.role IS 'User role: admin or super_admin';
COMMENT ON COLUMN admin_users.is_active IS 'Whether the admin user account is active';

-- Column comments for email_campaigns
COMMENT ON COLUMN email_campaigns.recipient_filter IS 'JSON filter criteria for selecting campaign recipients';
COMMENT ON COLUMN email_campaigns.status IS 'Campaign status: draft, scheduled, sending, sent, or failed';

-- Column comments for analytics_events
COMMENT ON COLUMN analytics_events.event_type IS 'Type of event being tracked (e.g., page_view, rsvp_submit, photo_upload)';
COMMENT ON COLUMN analytics_events.metadata IS 'Additional event data stored as JSON';

-- Column comments for albums
COMMENT ON COLUMN albums.is_public IS 'Whether the album is visible to guests';
COMMENT ON COLUMN albums.sort_order IS 'Display order for album listing';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Schema optimization migration completed successfully!';
  RAISE NOTICE 'Created tables: admin_users, email_campaigns, analytics_events, albums';
  RAISE NOTICE 'Added foreign key constraints and performance indexes';
  RAISE NOTICE 'Configured Row Level Security policies';
END $$;
