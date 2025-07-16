# Ashton & Cheyenne's Wedding Website User Flows

## Guest User Journey

### 1. Initial Invitation Flow
```
Guest receives Ashton & Cheyenne's email invitation
    ↓
Clicks unique invitation link
    ↓
Auto-authentication via invitation code
    ↓
Redirected to personalized welcome page
    ↓
Sees Ashton & Cheyenne's wedding details and RSVP prompt
```

### 2. RSVP Process Flow
```
Guest clicks "RSVP Now" button
    ↓
RSVP form loads with pre-filled guest info
    ↓
Guest selects attendance status
    ↓
If attending:
    ├── Select meal preference
    ├── Add dietary restrictions (optional)
    ├── If plus-one allowed:
    │   ├── Add plus-one name
    │   └── Select plus-one meal
    └── Add special notes (optional)
    ↓
Submit RSVP
    ↓
Confirmation page with Ashton & Cheyenne's wedding details
    ↓
Confirmation email sent
```

### 3. Wedding Information Access Flow
```
Guest navigates to Ashton & Cheyenne's wedding info sections:
    ├── Ceremony Details
    │   ├── Date & Time
    │   ├── Venue Address
    │   ├── Dress Code
    │   └── Parking Info
    ├── Reception Details
    │   ├── Location
    │   ├── Timeline
    │   └── Special Instructions
    ├── Accommodations
    │   ├── Recommended Hotels
    │   ├── Group Rates
    │   └── Booking Links
    ├── Travel & Directions
    │   ├── Venue Directions
    │   ├── Airport Information
    │   └── Transportation Options
    └── Registry Information
        ├── Ashton & Cheyenne's Gift Registry Links
        └── Contribution Options
```

### 4. Guest Communication Flow
```
Guest has question
    ↓
Navigates to "Contact Us" section
    ↓
Fills out message form:
    ├── Subject selection
    ├── Message text
    └── Urgency level
    ↓
Submits message
    ↓
Confirmation message displayed
    ↓
Ashton & Cheyenne receive notification
    ↓
Ashton & Cheyenne respond via admin panel
    ↓
Guest receives email notification of response
    ↓
Guest can view response on website
```

### 5. Photo Sharing Flow
```
Guest wants to share photos
    ↓
Navigates to photo gallery
    ↓
Clicks "Upload Photos" button
    ↓
Photo upload interface:
    ├── Drag & drop or file selection
    ├── Multiple photo selection
    ├── Add captions (optional)
    └── Preview before upload
    ↓
Photos uploaded to pending approval
    ↓
Confirmation message shown
    ↓
Admin approves photos
    ↓
Photos appear in public gallery
    ↓
Other guests can view and download
```

## Admin User Journey

### 1. Admin Authentication Flow
```
Admin visits admin login page
    ↓
Enters email and password
    ↓
Two-factor authentication (optional)
    ↓
Redirected to admin dashboard
    ↓
Dashboard shows:
    ├── RSVP Statistics
    ├── Recent Messages
    ├── Pending Photo Approvals
    └── Quick Actions
```

### 2. Guest Management Flow
```
Admin accesses guest management
    ↓
Guest list with filters:
    ├── RSVP Status
    ├── Meal Preferences
    ├── Plus-one Status
    └── Group Assignments
    ↓
Admin can:
    ├── Add new guests
    ├── Edit guest information
    ├── Send individual invitations
    ├── Send RSVP reminders
    ├── Export guest data
    └── View detailed guest profiles
```

### 3. Invitation Management Flow
```
Admin creates invitation campaign
    ↓
Select guest groups to invite
    ↓
Choose email template
    ↓
Customize message content
    ↓
Preview invitation
    ↓
Schedule or send immediately
    ↓
Track delivery status
    ↓
Monitor RSVP responses
    ↓
Send follow-up reminders to non-responders
```

### 4. Content Management Flow
```
Admin updates wedding information
    ↓
Navigate to content management
    ↓
Select section to edit:
    ├── Ceremony Details
    ├── Reception Information
    ├── Accommodations
    ├── Travel Information
    └── Registry Details
    ↓
Edit content using rich text editor
    ↓
Preview changes
    ↓
Publish updates
    ↓
Changes immediately visible to guests
```

### 5. Message Response Flow
```
Admin receives new message notification
    ↓
Views message in admin panel
    ↓
Reads guest question/request
    ↓
Composes response
    ↓
Sends response
    ↓
Message marked as "responded"
    ↓
Guest receives email notification
    ↓
Response logged for future reference
```

### 6. Photo Moderation Flow
```
Guest uploads photos
    ↓
Photos appear in admin moderation queue
    ↓
Admin reviews each photo:
    ├── Check for appropriate content
    ├── Verify image quality
    └── Read captions
    ↓
Admin actions:
    ├── Approve (photo goes live)
    ├── Reject (with reason)
    └── Request changes
    ↓
Approved photos appear in public gallery
    ↓
Rejected photos notification sent to uploader
```

## Mobile User Experience Flow

### 1. Mobile-First Design Considerations
```
Guest accesses site on mobile
    ↓
Responsive design adapts:
    ├── Touch-friendly buttons
    ├── Optimized image sizes
    ├── Simplified navigation
    └── Fast loading times
    ↓
Key mobile features:
    ├── One-thumb navigation
    ├── Quick RSVP access
    ├── Easy photo uploads
    ├── Offline content viewing
    └── Add to calendar functionality
```

### 2. Mobile Photo Upload Flow
```
Guest opens camera app
    ↓
Takes wedding photos
    ↓
Opens wedding website
    ↓
Navigates to photo upload
    ↓
Selects photos from camera roll
    ↓
Photos automatically compressed
    ↓
Batch upload with progress indicator
    ↓
Upload completes with confirmation
```

## Error Handling Flows

### 1. Invalid Invitation Code
```
Guest clicks invalid/expired link
    ↓
Error page displayed
    ↓
Options provided:
    ├── Contact couple for new link
    ├── Search by name/email
    └── Request new invitation
```

### 2. RSVP Deadline Passed
```
Guest attempts late RSVP
    ↓
Warning message displayed
    ↓
Options:
    ├── Submit late RSVP with note
    ├── Contact couple directly
    └── View wedding information only
```

### 3. Photo Upload Failures
```
Photo upload fails
    ↓
Error message with specific reason:
    ├── File too large
    ├── Invalid file type
    ├── Network error
    └── Server error
    ↓
Retry options provided
    ↓
Alternative upload methods suggested
```

## Accessibility Considerations

### 1. Screen Reader Support
```
All images have alt text
All forms have proper labels
Navigation is keyboard accessible
Content hierarchy is logical
ARIA labels for interactive elements
```

### 2. Visual Accessibility
```
High contrast color scheme option
Scalable text (up to 200%)
Clear focus indicators
No color-only information
Sufficient color contrast ratios
```

### 3. Motor Accessibility
```
Large touch targets (44px minimum)
No time-based interactions
Alternative input methods
Keyboard navigation support
Voice control compatibility
```

This comprehensive user flow documentation ensures all user interactions are well-planned and provide excellent user experience across all devices and accessibility needs.
