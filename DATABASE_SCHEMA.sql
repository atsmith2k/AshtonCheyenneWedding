-- Ashton & Cheyenne's Wedding Website Database Schema
-- Designed for Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE rsvp_status AS ENUM ('pending', 'attending', 'not_attending');
CREATE TYPE message_status AS ENUM ('new', 'responded', 'archived');
CREATE TYPE meal_option AS ENUM ('chicken', 'beef', 'fish', 'vegetarian', 'vegan', 'kids_meal');

-- Admin Users Table (moved up to resolve dependencies)
-- Couple and wedding party admin access
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest Groups Table
-- Represents invitation groups (families, couples, individuals)
CREATE TABLE guest_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_name TEXT NOT NULL,
    max_guests INTEGER NOT NULL DEFAULT 1,
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guests Table
-- Individual guest records with RSVP information
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    invitation_code TEXT UNIQUE NOT NULL,
    group_id UUID REFERENCES guest_groups(id) ON DELETE CASCADE,
    rsvp_status rsvp_status DEFAULT 'pending',
    meal_preference meal_option,
    dietary_restrictions TEXT,
    children_attending BOOLEAN DEFAULT FALSE,
    plus_one_allowed BOOLEAN DEFAULT FALSE,
    plus_one_name TEXT,
    plus_one_meal meal_option,
    special_notes TEXT, -- For wedding party notes
    rsvp_submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wedding Events Table
-- Different events throughout the wedding (ceremony, reception, etc.)
CREATE TABLE wedding_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT NOT NULL,
    address TEXT,
    dress_code TEXT,
    additional_info TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest Event Attendance
-- Track which events each guest is attending
CREATE TABLE guest_event_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    event_id UUID REFERENCES wedding_events(id) ON DELETE CASCADE,
    attending BOOLEAN DEFAULT TRUE,
    plus_one_attending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(guest_id, event_id)
);

-- Messages Table
-- Guest questions and couple responses
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT,
    status message_status DEFAULT 'new',
    is_urgent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- Photos Table
-- Wedding photo gallery with guest uploads and admin management
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploaded_by_guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    uploaded_by_admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    original_filename TEXT,
    caption TEXT,
    alt_text TEXT,
    approved BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    album_id UUID,
    tags TEXT[], -- Array of tags for organization
    sort_order INTEGER DEFAULT 0,
    moderation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES admin_users(id)
);

-- Photo Albums Table
-- Organize photos into albums/galleries
CREATE TABLE photo_albums (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    cover_photo_id UUID REFERENCES photos(id),
    published BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for album_id in photos table
ALTER TABLE photos ADD CONSTRAINT fk_photos_album
    FOREIGN KEY (album_id) REFERENCES photo_albums(id) ON DELETE SET NULL;

-- Wedding Information Table
-- Dynamic content management for wedding details with CMS features
CREATE TABLE wedding_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Rich HTML content
    plain_text_content TEXT, -- For search and previews
    order_index INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    meta_description TEXT,
    seo_keywords TEXT,
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content Version History Table
-- Track changes to wedding information content
CREATE TABLE wedding_info_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_info_id UUID REFERENCES wedding_info(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    changes_summary TEXT,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Users Table already created above

-- Email Templates Table
-- Customizable email templates for invitations and reminders
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_type TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs Table
-- Track sent emails for debugging and analytics
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID,
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    template_id UUID REFERENCES email_templates(id),
    template_type TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    delivery_status TEXT DEFAULT 'sent',
    error_message TEXT,
    tracking_id TEXT UNIQUE
);

-- Email Campaigns Table
-- Track email campaigns and bulk sends
CREATE TABLE email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id),
    subject TEXT NOT NULL,
    recipient_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, scheduled, sending, sent, completed
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guest Import/Export Logs
-- Track bulk guest operations
CREATE TABLE guest_import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    total_records INTEGER,
    successful_imports INTEGER,
    failed_imports INTEGER,
    error_details JSONB,
    imported_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics Events Table
-- Track user interactions for analytics
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL, -- page_view, rsvp_submit, photo_upload, etc.
    guest_id UUID REFERENCES guests(id) ON DELETE SET NULL,
    session_id TEXT,
    page_path TEXT,
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    metadata JSONB, -- Additional event-specific data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Analytics Summary Table
-- Aggregated daily statistics for performance
CREATE TABLE daily_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE UNIQUE NOT NULL,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    rsvp_submissions INTEGER DEFAULT 0,
    photo_uploads INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FAQ Management Table
-- Admin-managed frequently asked questions
CREATE TABLE faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    published BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    helpful_votes INTEGER DEFAULT 0,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_guests_invitation_code ON guests(invitation_code);
CREATE INDEX idx_guests_group_id ON guests(group_id);
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_guest_id ON messages(guest_id);
CREATE INDEX idx_photos_approved ON photos(approved);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by_guest_id);
CREATE INDEX idx_wedding_info_section ON wedding_info(section);
CREATE INDEX idx_email_logs_guest_id ON email_logs(guest_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_guest_groups_updated_at BEFORE UPDATE ON guest_groups FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wedding_events_updated_at BEFORE UPDATE ON wedding_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wedding_info_updated_at BEFORE UPDATE ON wedding_info FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE guest_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_event_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Guest access policies (guests can only see their own data)
CREATE POLICY "Guests can view their own record" ON guests
    FOR SELECT USING (auth.jwt() ->> 'invitation_code' = invitation_code);

CREATE POLICY "Guests can update their own record" ON guests
    FOR UPDATE USING (auth.jwt() ->> 'invitation_code' = invitation_code);

-- Admin access policies (admins can see everything)
CREATE POLICY "Admins can view all guests" ON guests
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Public read access for wedding info and events
CREATE POLICY "Anyone can view published wedding info" ON wedding_info
    FOR SELECT USING (published = true);

CREATE POLICY "Anyone can view active events" ON wedding_events
    FOR SELECT USING (is_active = true);

-- Photo policies
CREATE POLICY "Anyone can view approved photos" ON photos
    FOR SELECT USING (approved = true);

CREATE POLICY "Guests can upload photos" ON photos
    FOR INSERT WITH CHECK (auth.jwt() ->> 'guest_id' = uploaded_by_guest_id::text);

-- Message policies
CREATE POLICY "Guests can view their own messages" ON messages
    FOR SELECT USING (auth.jwt() ->> 'guest_id' = guest_id::text);

CREATE POLICY "Guests can create messages" ON messages
    FOR INSERT WITH CHECK (auth.jwt() ->> 'guest_id' = guest_id::text);

-- Insert default wedding info sections for Ashton & Cheyenne
INSERT INTO wedding_info (section, title, content, order_index) VALUES
('welcome', 'Welcome to Ashton & Cheyenne''s Wedding', 'Welcome to Ashton and Cheyenne''s wedding website! We''re so excited to celebrate our special day with you.', 1),
('ceremony', 'Wedding Ceremony', 'Join Ashton and Cheyenne for their wedding ceremony - details to be added.', 2),
('reception', 'Reception Celebration', 'Celebrate with Ashton and Cheyenne at their reception - details to be added.', 3),
('accommodations', 'Accommodations', 'Information about nearby hotels and lodging options for Ashton & Cheyenne''s wedding guests.', 4),
('travel', 'Travel & Directions', 'Getting to Ashton and Cheyenne''s wedding venue and travel information.', 5),
('registry', 'Gift Registry', 'Ashton and Cheyenne''s gift registry information and links.', 6);

-- Insert default email templates for Ashton & Cheyenne
INSERT INTO email_templates (template_type, subject, html_content, text_content) VALUES
('invitation', 'You''re Invited to Ashton & Cheyenne''s Wedding!', '<h1>You''re Invited!</h1><p>Ashton and Cheyenne are excited to celebrate their special day with you.</p>', 'You''re Invited! Ashton and Cheyenne are excited to celebrate their special day with you.'),
('rsvp_reminder', 'RSVP Reminder - Ashton & Cheyenne''s Wedding', '<h1>RSVP Reminder</h1><p>Please don''t forget to RSVP for Ashton and Cheyenne''s wedding.</p>', 'RSVP Reminder: Please don''t forget to RSVP for Ashton and Cheyenne''s wedding.'),
('rsvp_confirmation', 'RSVP Confirmed - Ashton & Cheyenne''s Wedding', '<h1>Thank You!</h1><p>Your RSVP for Ashton and Cheyenne''s wedding has been confirmed.</p>', 'Thank You! Your RSVP for Ashton and Cheyenne''s wedding has been confirmed.');
