# Phase 2 Testing & Validation Guide

## 🧪 Testing Checklist

### Database Integration Tests

#### ✅ **RSVP System**
- [ ] Guest can submit RSVP with valid invitation code
- [ ] RSVP data is saved correctly to database
- [ ] Meal preferences are stored properly
- [ ] Plus-one information is handled correctly
- [ ] Form validation works for required fields
- [ ] Error handling for invalid data

**Test Commands:**
```bash
# Test RSVP submission
curl -X POST http://localhost:3000/api/rsvp/submit \
  -H "Content-Type: application/json" \
  -d '{
    "guestId": "test-uuid",
    "attending": "attending",
    "mealPreference": "chicken",
    "notes": "Looking forward to it!"
  }'
```

#### ✅ **Authentication System**
- [ ] Invitation code validation works
- [ ] Invalid codes are rejected
- [ ] Guest session is maintained
- [ ] Admin authentication restricts access
- [ ] Sign out functionality works

**Test Commands:**
```bash
# Test invitation validation
curl -X POST http://localhost:3000/api/auth/validate-invitation \
  -H "Content-Type: application/json" \
  -d '{"invitationCode": "test123"}'
```

#### ✅ **Photo Upload System**
- [ ] Photos upload successfully to Supabase Storage
- [ ] File validation (type, size) works
- [ ] Photo records are saved to database
- [ ] Admin can approve/reject photos
- [ ] Bulk operations work correctly

**Test Commands:**
```bash
# Test photo upload
curl -X POST http://localhost:3000/api/photos/upload \
  -F "file=@test-photo.jpg" \
  -F "guestId=test-uuid" \
  -F "caption=Test photo"
```

#### ✅ **Message System**
- [ ] Guest messages are saved correctly
- [ ] Admin can view all messages
- [ ] Message status updates work
- [ ] Urgent messages are flagged properly

### Admin CMS Tests

#### ✅ **Content Management**
- [ ] Admin can edit wedding information
- [ ] Rich text content is saved properly
- [ ] Published/draft status works
- [ ] Content appears on frontend immediately

#### ✅ **Guest Management**
- [ ] Admin can view all guests
- [ ] Search and filtering work
- [ ] RSVP statistics are accurate
- [ ] Bulk operations function correctly

#### ✅ **Photo Moderation**
- [ ] Pending photos appear in admin
- [ ] Approve/reject functionality works
- [ ] Bulk moderation operations work
- [ ] Approved photos appear on frontend

#### ✅ **Communications Dashboard**
- [ ] Messages appear in admin interface
- [ ] Message counts are accurate
- [ ] Status updates work properly

### Frontend Integration Tests

#### ✅ **Guest Experience**
- [ ] Homepage loads correctly
- [ ] Wedding information displays from database
- [ ] RSVP form submits successfully
- [ ] Photo gallery shows approved photos
- [ ] Contact form sends messages

#### ✅ **Admin Experience**
- [ ] Admin dashboard shows real statistics
- [ ] All admin pages load correctly
- [ ] Navigation works properly
- [ ] Mobile responsiveness maintained

### Error Handling Tests

#### ✅ **API Error Handling**
- [ ] Invalid data returns proper error messages
- [ ] Database connection errors are handled
- [ ] File upload errors are managed
- [ ] Authentication errors are clear

#### ✅ **Frontend Error Handling**
- [ ] Form validation shows helpful messages
- [ ] Network errors are handled gracefully
- [ ] Loading states work properly
- [ ] Fallback content displays when needed

## 🔧 Setup Instructions for Testing

### 1. Environment Setup
```bash
# Copy environment template
cp .env.local.example .env.local

# Add your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 2. Database Setup
```sql
-- Run the complete schema in Supabase SQL editor
-- File: DATABASE_SCHEMA.sql

-- Create test data
INSERT INTO guest_groups (group_name, max_guests) VALUES 
('Family', 10),
('Friends', 15),
('Work Colleagues', 8);

INSERT INTO guests (first_name, last_name, email, invitation_code, group_id, plus_one_allowed) VALUES 
('John', 'Smith', 'john@example.com', 'test123', (SELECT id FROM guest_groups WHERE group_name = 'Family'), true),
('Jane', 'Doe', 'jane@example.com', 'test456', (SELECT id FROM guest_groups WHERE group_name = 'Friends'), false);

INSERT INTO wedding_info (section, title, content, published) VALUES 
('welcome', 'Welcome', 'Welcome to our wedding website!', true),
('ceremony', 'Ceremony', 'Join us for our ceremony at 3 PM.', true);
```

### 3. Storage Setup
```bash
# Create storage bucket in Supabase
# Bucket name: wedding-photos
# Public access: enabled
# File size limit: 10MB
```

### 4. Test Data Creation
```bash
# Start development server
npm run dev

# Create test invitation codes in database
# Use Supabase dashboard or SQL editor
```

## 📱 Mobile Testing

### Responsive Design Checklist
- [ ] Homepage displays correctly on mobile
- [ ] RSVP form is touch-friendly
- [ ] Photo gallery works on mobile
- [ ] Admin dashboard is mobile-responsive
- [ ] Navigation menus work on small screens

### Touch Interaction Tests
- [ ] Buttons are large enough for touch
- [ ] Form inputs work with mobile keyboards
- [ ] Photo upload works on mobile
- [ ] Swipe gestures work where implemented

## 🔒 Security Testing

### Authentication Security
- [ ] Admin routes are properly protected
- [ ] Guest data is isolated by invitation code
- [ ] File uploads are validated and secure
- [ ] SQL injection protection works

### Data Validation
- [ ] All form inputs are validated
- [ ] File uploads check type and size
- [ ] Email addresses are validated
- [ ] XSS protection is in place

## 📊 Performance Testing

### Load Time Tests
- [ ] Homepage loads in under 2 seconds
- [ ] Admin dashboard loads quickly
- [ ] Photo gallery loads efficiently
- [ ] Database queries are optimized

### Image Optimization
- [ ] Photos are compressed appropriately
- [ ] Thumbnails are generated
- [ ] Lazy loading works correctly
- [ ] Storage usage is reasonable

## 🐛 Common Issues & Solutions

### Database Connection Issues
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify database schema is applied
# Check Supabase dashboard for tables
```

### Photo Upload Issues
```bash
# Check storage bucket exists
# Verify bucket permissions
# Test file size limits
# Check CORS settings
```

### Authentication Issues
```bash
# Verify invitation codes exist in database
# Check admin email configuration
# Test session management
```

## ✅ Validation Criteria

### Functionality Requirements
- ✅ All API endpoints return proper responses
- ✅ Database operations work correctly
- ✅ File uploads function properly
- ✅ Authentication restricts access appropriately

### User Experience Requirements
- ✅ Forms provide clear feedback
- ✅ Loading states are shown
- ✅ Error messages are helpful
- ✅ Mobile experience is smooth

### Performance Requirements
- ✅ Page load times under 3 seconds
- ✅ Database queries optimized
- ✅ Images properly compressed
- ✅ No memory leaks in admin interface

### Security Requirements
- ✅ Data validation on all inputs
- ✅ Proper authentication checks
- ✅ File upload security
- ✅ XSS and injection protection

## 🚀 Deployment Readiness

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] Environment variables configured
- [ ] Database schema applied
- [ ] Storage buckets created
- [ ] Domain configured (if applicable)
- [ ] SSL certificate ready

### Post-deployment Verification
- [ ] All pages load correctly
- [ ] Database connections work
- [ ] File uploads function
- [ ] Email delivery works (when implemented)
- [ ] Admin access is secure

This comprehensive testing guide ensures that all Phase 2 functionality works correctly and is ready for production use.
