# Ashton & Cheyenne's Wedding Website Implementation Plan

## Project Overview
A comprehensive wedding website for Ashton and Cheyenne serving the entire wedding timeline with digital invitations, RSVP management, information hub, guest communication, and photo sharing capabilities.

## Technical Architecture

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with custom guest management
- **File Storage**: Supabase Storage for photos and documents
- **Deployment**: Vercel (seamless Next.js integration)
- **Email**: Resend or SendGrid for invitation delivery
- **Image Processing**: Next.js Image Optimization + Sharp

### Architecture Benefits
- **Cost-Effective**: Supabase free tier supports up to 50,000 monthly active users
- **Performance**: Next.js SSR/SSG for fast loading, Vercel Edge Network
- **Scalability**: Serverless architecture scales automatically
- **Developer Experience**: TypeScript for type safety, hot reload for development

## Domain Name & Branding Suggestions

### Recommended Domain Options
1. **ashtonandcheyenne.com** - Classic and straightforward
2. **ashtonlovescheyenne.com** - Romantic and memorable
3. **cheyenneandashton.com** - Alternative ordering
4. **ashtoncheyenne2025.com** - Includes wedding year
5. **togetherforever-ac.com** - Romantic with initials
6. **acwedding.com** - Simple initials approach
7. **ashtoncheyennewedding.com** - Clear and descriptive

### Suggested Taglines & Slogans
- "Two Hearts, One Love Story"
- "Ashton & Cheyenne: A Love Story Begins"
- "Join Us as We Say 'I Do'"
- "Love, Laughter, and Happily Ever After"
- "Our Journey to Forever Starts Here"
- "Celebrating Love, Family, and New Beginnings"
- "From This Day Forward"

### Sample Email Template with Personalized Branding
```html
Subject: You're Invited to Ashton & Cheyenne's Wedding! 💕

Dear [Guest Name],

Ashton and Cheyenne are thrilled to invite you to celebrate their special day!

🌟 Two Hearts, One Love Story 🌟

You're invited to witness Ashton and Cheyenne exchange vows and begin their journey as husband and wife.

[Wedding Details]
📅 Date: [Wedding Date]
🕐 Time: [Wedding Time]
📍 Location: [Venue Name & Address]

Please visit our wedding website to RSVP and find all the details:
👉 https://ashtonandcheyenne[domain].com/rsvp/[unique-code]

We can't wait to celebrate with you!

With love,
Ashton & Cheyenne ❤️

P.S. Don't forget to use #AshtonAndCheyenne when sharing photos!
```

## Database Schema Design

### Core Tables

#### guests
```sql
- id (uuid, primary key)
- email (text, unique)
- first_name (text)
- last_name (text)
- phone (text, optional)
- invitation_code (text, unique)
- group_id (uuid, foreign key to guest_groups)
- rsvp_status (enum: pending, attending, not_attending)
- meal_preference (text, optional)
- dietary_restrictions (text, optional)
- plus_one_allowed (boolean)
- plus_one_name (text, optional)
- plus_one_meal (text, optional)
- created_at (timestamp)
- updated_at (timestamp)
```

#### guest_groups
```sql
- id (uuid, primary key)
- group_name (text)
- max_guests (integer)
- invitation_sent_at (timestamp, optional)
- created_at (timestamp)
```

#### wedding_events
```sql
- id (uuid, primary key)
- name (text)
- description (text)
- date_time (timestamp)
- location (text)
- dress_code (text, optional)
- created_at (timestamp)
```

#### messages
```sql
- id (uuid, primary key)
- guest_id (uuid, foreign key)
- subject (text)
- message (text)
- response (text, optional)
- status (enum: new, responded, archived)
- created_at (timestamp)
- responded_at (timestamp, optional)
```

#### photos
```sql
- id (uuid, primary key)
- uploaded_by_guest_id (uuid, foreign key, optional)
- file_path (text)
- caption (text, optional)
- approved (boolean, default false)
- created_at (timestamp)
```

#### wedding_info
```sql
- id (uuid, primary key)
- section (text, unique)
- title (text)
- content (text)
- order_index (integer)
- published (boolean)
- updated_at (timestamp)
```

## Feature Breakdown & Development Phases

### Phase 1: Foundation (Week 1-2)
1. **Project Setup**
   - Initialize Next.js with TypeScript
   - Configure Tailwind CSS and UI components
   - Set up Supabase project and database
   - Implement basic routing structure

2. **Authentication System**
   - Guest authentication via invitation codes
   - Admin authentication for couple
   - Protected routes and middleware
   - Session management

### Phase 2: Core Features (Week 3-4)
3. **Guest Management & RSVP**
   - Guest registration and profile management
   - RSVP form with meal preferences
   - Plus-one management
   - Comprehensive admin dashboard for guest overview

4. **Digital Invitations**
   - Personalized invitation templates
   - Email delivery system
   - Unique invitation links
   - RSVP tracking and reminders

5. **Admin Content Management System**
   - Rich text editor for all content sections
   - Image upload and management system
   - Drag-and-drop content reordering
   - Preview functionality before publishing

### Phase 3: Content & Communication (Week 5-6)
6. **Wedding Information Hub**
   - Dynamic content management with CMS
   - Event schedule display with admin editing
   - Venue and accommodation information management
   - Travel and logistics details with rich editing

7. **Guest Communication & Email Management**
   - Message submission form
   - Admin response system with threading
   - Customizable email template editor
   - FAQ section with admin management
   - Targeted messaging to guest groups

### Phase 4: Media & Analytics (Week 7-8)
8. **Photo Gallery & Media Management**
   - Photo upload with compression
   - Gallery display with filtering
   - Advanced admin moderation system
   - Bulk photo operations (approve/reject/delete)
   - Media library organization

9. **Analytics & Reporting Dashboard**
   - RSVP tracking and statistics
   - Guest engagement metrics
   - Email delivery and open rate tracking
   - Exportable reports for planning

10. **Final Polish & Testing**
    - Mobile responsiveness optimization
    - Performance optimization
    - SEO implementation
    - Comprehensive testing and bug fixes

## User Flow Diagrams

### Guest Journey
```
1. Receive Ashton & Cheyenne's invitation email with unique link
2. Click link → Auto-authentication via invitation code
3. View personalized welcome page for Ashton & Cheyenne's wedding
4. Complete RSVP form (meal preferences, plus-one)
5. Access Ashton & Cheyenne's wedding information hub
6. Submit questions via communication system
7. Upload/view photos in gallery
8. Receive updates and reminders about the wedding
```

### Admin Journey (Ashton & Cheyenne)
```
1. Admin login with credentials
2. Dashboard overview (RSVP stats, guest messages)
3. Manage guest list and groups
4. Send invitations and reminders
5. Respond to guest messages
6. Moderate photo uploads
7. Update wedding information
8. Export guest data and reports
```

## Security Considerations

### Data Protection
- **Encryption**: All data encrypted at rest and in transit
- **Access Control**: Row Level Security (RLS) policies in Supabase
- **Authentication**: Secure invitation codes, admin 2FA
- **Privacy**: Guest data isolation, GDPR compliance options

### Security Measures
- Input validation and sanitization
- Rate limiting on forms and uploads
- File type validation for photo uploads
- Secure environment variable management
- Regular security updates and monitoring

## Cost Estimation

### Monthly Costs (Estimated)
- **Supabase**: $0-25/month (free tier covers most wedding needs)
- **Vercel**: $0-20/month (hobby plan sufficient)
- **Domain**: $10-15/year
- **Email Service**: $0-10/month (Resend free tier: 3,000 emails/month)
- **Total**: $0-55/month during active period

### Scalability Considerations
- Supabase free tier: 500MB database, 1GB file storage
- Supports 100-200 wedding guests comfortably
- Can upgrade tiers if needed for larger weddings
- Vercel automatically scales with traffic

## Third-Party Integrations

### Recommended Services
1. **Email**: Resend (modern, reliable, great DX)
2. **Analytics**: Vercel Analytics (privacy-focused)
3. **Monitoring**: Vercel monitoring + Supabase dashboard
4. **Image Optimization**: Built-in Next.js Image component

### Optional Enhancements
- **Calendar Integration**: Add Ashton & Cheyenne's wedding events to guest calendars
- **Maps Integration**: Venue location and directions
- **Weather API**: Weather forecast for Ashton & Cheyenne's wedding date
- **Social Media**: Instagram feed integration for #AshtonAndCheyenne

## Development Timeline

### 8-Week Development Schedule
- **Weeks 1-2**: Foundation and authentication
- **Weeks 3-4**: Core RSVP and invitation features
- **Weeks 5-6**: Information hub and communication
- **Weeks 7-8**: Photo gallery and final polish

### Milestones
- Week 2: Basic site with authentication working
- Week 4: RSVP system functional, invitations can be sent
- Week 6: All core features complete
- Week 8: Production-ready with testing complete

## Next Steps

1. **Review and Approve Plan**: Confirm technical approach and features
2. **Environment Setup**: Create Supabase project and Vercel account
3. **Design Decisions**: Choose color scheme, fonts, and overall aesthetic
4. **Content Preparation**: Gather wedding details, photos, and copy
5. **Development Start**: Begin with project initialization

This plan provides a solid foundation for a professional, scalable wedding website that will serve Ashton and Cheyenne well throughout their wedding journey while maintaining cost efficiency and excellent user experience.
