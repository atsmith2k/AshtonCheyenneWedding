# Guest Access Request System

A comprehensive system for managing guest access requests to the wedding website, implemented using Test-Driven Development (TDD) principles.

## 🎯 Overview

The Guest Access Request System allows potential guests to request access to the wedding website when they don't have an invitation code. Admins can review, approve, or deny these requests through a dedicated admin interface.

## ✨ Features

### For Guests
- **Request Access Form** - Simple form to request website access
- **Real-time Validation** - Comprehensive form validation with helpful error messages
- **Status Tracking** - Ability to check request status
- **Mobile Responsive** - Optimized for all devices
- **Security Measures** - Bot detection and rate limiting

### For Admins
- **Request Management** - View, approve, deny, or delete access requests
- **Bulk Actions** - Process multiple requests at once
- **Email Integration** - Automatic notifications and invitation sending
- **Detailed Views** - Complete request information with admin notes
- **Status Filtering** - Filter requests by status (pending, approved, denied)
- **Analytics Dashboard** - Request statistics and metrics

## 🏗️ Architecture

### Database Schema
```sql
access_requests (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,        -- Encrypted
  address TEXT NOT NULL,      -- Encrypted
  message TEXT,
  status TEXT DEFAULT 'pending',
  admin_notes TEXT,
  invitation_code TEXT UNIQUE,
  invitation_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ
)
```

### API Endpoints

#### Public Endpoints
- `POST /api/access-requests` - Submit new access request
- `GET /api/access-requests?email=...` - Check request status

#### Admin Endpoints
- `GET /api/admin/access-requests` - List all requests with filtering
- `POST /api/admin/access-requests` - Bulk actions on requests
- `GET /api/admin/access-requests/[id]` - Get specific request
- `PATCH /api/admin/access-requests/[id]` - Update request status
- `DELETE /api/admin/access-requests/[id]` - Delete request

### Frontend Components
- `AccessRequestForm` - Main request submission form
- `AccessRequestsPage` - Admin management interface
- Request access link on landing page
- Admin sidebar navigation integration

## 🔒 Security Features

### Data Protection
- **Encryption** - Sensitive data (phone, address) encrypted at rest
- **Input Sanitization** - All inputs sanitized and validated
- **Rate Limiting** - Prevents spam submissions
- **CSRF Protection** - Cross-site request forgery protection

### Access Control
- **Row Level Security** - Database-level access control
- **Admin Authentication** - Only authenticated admins can manage requests
- **Audit Trail** - Complete history of admin actions

### Bot Protection
- **Honeypot Fields** - Hidden fields to detect bots
- **Timestamp Validation** - Prevents replay attacks
- **Duplicate Detection** - Prevents multiple submissions

## 📧 Email Integration

### Admin Notifications
When a new access request is submitted:
- Automatic email sent to all admin users
- Includes complete request details
- Direct link to admin dashboard for review

### Approval Emails
When a request is approved:
- Personalized invitation email sent to requester
- Includes unique invitation code
- Direct link to wedding website
- Instructions for accessing the site

## 🚀 Setup Instructions

### 1. Database Migration
Run the database migration to create the access_requests table:

```bash
# Automatic migration (recommended)
npx tsx src/scripts/run-migration.ts

# Manual migration
# Copy contents of src/migrations/001_create_access_requests_table.sql
# Paste into Supabase SQL Editor and execute
```

### 2. Environment Variables
Ensure these environment variables are set:

```env
# Required for admin notifications
ADMIN_EMAIL=admin1@example.com,admin2@example.com

# Required for email sending
RESEND_API_KEY=your_resend_api_key

# Required for invitation links
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3. Admin Dashboard Access
The access requests section is automatically added to the admin sidebar navigation at `/admin/access-requests`.

## 📱 Usage Guide

### For Guests
1. Visit the wedding website landing page
2. Click "Request Access" if no invitation code
3. Fill out the access request form
4. Submit and wait for admin approval
5. Check email for invitation code if approved

### For Admins
1. Navigate to Admin Dashboard → Access Requests
2. View all pending requests with details
3. Click on a request to view full details
4. Approve, deny, or delete requests as needed
5. Optionally add admin notes for record keeping
6. Send invitation emails automatically upon approval

## 🧪 Testing Strategy

The system was implemented using TDD principles with comprehensive validation:

### Validation Testing
- Form input validation (client and server-side)
- Email format validation
- Phone number format validation
- Address completeness validation
- Message length limits

### Security Testing
- Rate limiting functionality
- Bot detection mechanisms
- Input sanitization
- CSRF protection
- Authentication requirements

### API Testing
- Request submission endpoints
- Admin management endpoints
- Error handling scenarios
- Edge cases and boundary conditions

### UI Testing
- Form submission flows
- Error state handling
- Success state display
- Mobile responsiveness
- Admin interface functionality

## 🔧 Customization

### Form Fields
To modify the access request form fields, update:
- `src/lib/validation.ts` - Validation schemas
- `src/components/access-request-form.tsx` - Form component
- `src/types/database.ts` - Database types
- Migration SQL file for database schema

### Email Templates
Email templates can be customized in:
- `src/app/api/access-requests/route.ts` - Admin notification email
- `src/app/api/admin/access-requests/[id]/route.ts` - Approval email

### Admin Interface
The admin interface can be customized in:
- `src/app/admin/access-requests/page.tsx` - Main admin page
- `src/components/admin/sidebar.tsx` - Navigation

## 📊 Monitoring & Analytics

### Request Metrics
The admin dashboard provides:
- Total requests submitted
- Pending requests count
- Approved requests count
- Denied requests count
- Request submission trends

### Email Tracking
Email delivery is tracked with:
- Delivery timestamps
- Invitation code generation
- Admin action audit trail

## 🐛 Troubleshooting

### Common Issues

**Migration Fails**
- Ensure SUPABASE_SERVICE_ROLE_KEY is set
- Check database permissions
- Run migration manually via SQL Editor

**Emails Not Sending**
- Verify RESEND_API_KEY is configured
- Check admin email addresses in ADMIN_EMAIL
- Review email service logs

**Form Validation Errors**
- Check client-side validation rules
- Verify server-side validation schemas match
- Review error message display logic

**Admin Access Issues**
- Confirm admin authentication is working
- Check admin user permissions
- Verify RLS policies are applied correctly

## 🔄 Future Enhancements

Potential improvements for the access request system:

1. **Advanced Analytics** - Request trends and conversion metrics
2. **Automated Approval** - Rules-based automatic approval for certain criteria
3. **Integration with Guest List** - Cross-reference with existing guest database
4. **SMS Notifications** - Text message notifications for urgent requests
5. **Request Categories** - Different types of access requests (family, friends, vendors)
6. **Approval Workflows** - Multi-step approval process for different admin roles

## 📝 Contributing

When contributing to the access request system:

1. Follow existing code patterns and conventions
2. Add comprehensive validation for new fields
3. Update database types and migrations
4. Test all security measures thoroughly
5. Update documentation for any changes

## 📄 License

This access request system is part of the wedding website project and follows the same licensing terms.
