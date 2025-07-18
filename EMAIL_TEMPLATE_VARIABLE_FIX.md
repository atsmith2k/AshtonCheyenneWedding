# Email Template Variable Substitution Fix

## Problem Summary

Users were receiving emails with broken links containing literal `{{website_url}}` text instead of the actual website URL. The issue was caused by:

1. **Missing Environment Variable**: `NEXT_PUBLIC_APP_URL` was not properly configured
2. **Inconsistent Template Processing**: Different email routes used different variable processing approaches
3. **Double Processing**: Some routes manually processed templates and then passed them to the email service, causing conflicts

## Root Cause Analysis

### 1. Environment Variable Issue
- The `NEXT_PUBLIC_APP_URL` environment variable was not set in `.env.local`
- This caused the `website_url` template variable to use fallback values inconsistently
- Different parts of the codebase referenced different environment variable names

### 2. Template Processing Inconsistency
- The main email service (`src/lib/email-service.ts`) had proper template variable processing
- The recovery route (`src/app/api/auth/recover-invitation/route.ts`) was doing manual template processing
- This led to double processing and potential variable replacement failures

### 3. Code Duplication
- Multiple routes had their own template variable processing logic
- This made it difficult to maintain consistency and debug issues

## Solution Implemented

### 1. Environment Variable Configuration
- Created `.env.local` file with proper `NEXT_PUBLIC_APP_URL` configuration
- Ensured consistent environment variable naming across the codebase
- Added validation and logging for environment variables

### 2. Centralized Email Processing
- Modified recovery routes to use the centralized `sendEmail()` function
- Removed manual template processing from individual routes
- Ensured all email sending goes through the same processing pipeline

### 3. Enhanced Logging
- Added detailed logging for template variable processing
- Added website URL logging to help debug future issues
- Improved error handling and debugging information

## Files Modified

### 1. `.env.local` (Created)
```bash
# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Development
# NEXT_PUBLIC_APP_URL=https://ashtonandcheyenne.com  # Production
```

### 2. `src/app/api/auth/recover-invitation/route.ts`
- Removed manual template processing
- Now uses centralized `sendEmail()` with `templateType: 'invitation_recovery'`
- Added enhanced logging for debugging

### 3. `src/app/api/auth/test-recovery/route.ts`
- Updated to use centralized email processing
- Consistent with recovery route approach

## Testing

### 1. Template Variable Test Script
Created `scripts/test-email-variables.js` to verify template processing:
```bash
node scripts/test-email-variables.js
```

### 2. Email Service Test Script
Created `scripts/test-email-service.js` to test the full email service:
```bash
node scripts/test-email-service.js
```

### 3. Test Results
- ✅ All template variables are correctly replaced
- ✅ Website URL is properly substituted
- ✅ Links are correctly formatted (e.g., `https://ashtonandcheyenne.com/landing`)

## Deployment Instructions

### For Development
1. Ensure `.env.local` exists with `NEXT_PUBLIC_APP_URL=http://localhost:3000`
2. Run the test scripts to verify functionality
3. Test email recovery functionality

### For Production (Vercel)
1. Set environment variable in Vercel dashboard:
   ```
   NEXT_PUBLIC_APP_URL=https://ashtonandcheyenne.com
   ```
2. Ensure all other required environment variables are set
3. Deploy and test email functionality

## Prevention Measures

### 1. Environment Variable Validation
- The `scripts/validate-env.js` script checks for required variables
- Run before deployment: `node scripts/validate-env.js`

### 2. Centralized Email Processing
- Always use the `sendEmail()` function from `src/lib/email-service.ts`
- Never manually process template variables in individual routes
- Use `templateType` parameter for database templates

### 3. Testing Protocol
- Run template variable tests before deploying email changes
- Test with actual email addresses in staging environment
- Verify links are clickable and lead to correct pages

## Template Variable Reference

### Available Variables
- `{{couple_names}}` - "Ashton & Cheyenne"
- `{{website_url}}` - Application URL (from `NEXT_PUBLIC_APP_URL`)
- `{{guest_first_name}}` - Guest's first name
- `{{guest_last_name}}` - Guest's last name
- `{{guest_full_name}}` - Full name
- `{{invitation_code}}` - Guest's invitation code
- `{{wedding_date}}` - Wedding date
- `{{wedding_venue}}` - Venue name
- `{{rsvp_deadline}}` - RSVP deadline

### Usage in Templates
```html
<p>Visit our website: {{website_url}}/landing</p>
<p>Your invitation code: {{invitation_code}}</p>
```

## Troubleshooting

### If Links Are Still Broken
1. Check environment variables: `echo $NEXT_PUBLIC_APP_URL`
2. Run test scripts to verify template processing
3. Check server logs for template processing errors
4. Verify email template content in database

### If Variables Aren't Replaced
1. Ensure using `sendEmail()` function with proper parameters
2. Check that template exists in database with correct `template_type`
3. Verify variable names match exactly (case-sensitive)
4. Check for typos in template variable syntax: `{{variable_name}}`

## Monitoring

### Production Monitoring
- Monitor email delivery success rates
- Check for template processing errors in logs
- Verify website URL is correctly set in production environment
- Test email functionality regularly

### Logging
- Email service logs template variable processing
- Recovery routes log website URL configuration
- Failed email sends are logged with detailed error information
