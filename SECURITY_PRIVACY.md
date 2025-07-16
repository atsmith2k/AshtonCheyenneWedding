# Ashton & Cheyenne's Wedding Website Security & Privacy Implementation Guide

## Security Architecture Overview

### Multi-Layer Security Approach
1. **Application Layer**: Input validation, authentication, authorization
2. **Database Layer**: Row Level Security (RLS), encrypted storage
3. **Network Layer**: HTTPS, secure headers, CORS policies
4. **Infrastructure Layer**: Supabase security, Vercel edge protection

## Authentication & Authorization

### Guest Authentication System
```typescript
// Invitation-based authentication
interface GuestAuth {
  invitationCode: string;
  guestId: string;
  groupId: string;
  permissions: string[];
}

// Secure invitation code generation
const generateInvitationCode = (): string => {
  return crypto.randomBytes(16).toString('hex');
};
```

**Security Features:**
- Unique invitation codes (32-character hex)
- No password requirements for guests
- Automatic session management
- Secure token storage

### Admin Authentication
```typescript
// Multi-factor authentication for admins
interface AdminAuth {
  email: string;
  password: string; // Hashed with bcrypt
  mfaEnabled: boolean;
  role: 'admin' | 'super_admin';
  lastLogin: Date;
}
```

**Security Features:**
- Strong password requirements
- Optional 2FA via email/SMS
- Session timeout (24 hours)
- Login attempt monitoring

## Data Protection & Privacy

### Personal Data Handling
```sql
-- GDPR-compliant data structure
CREATE TABLE guests (
    id UUID PRIMARY KEY,
    -- Personal identifiers
    email TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    
    -- Consent tracking
    privacy_consent BOOLEAN DEFAULT FALSE,
    marketing_consent BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE,
    
    -- Data retention
    data_retention_until DATE,
    deletion_requested BOOLEAN DEFAULT FALSE,
    deletion_requested_at TIMESTAMP WITH TIME ZONE
);
```

### Data Minimization Principles
- **Collect Only Necessary Data**: Name, email, RSVP preferences
- **Purpose Limitation**: Data used only for wedding purposes
- **Storage Limitation**: Automatic deletion after specified period
- **Accuracy**: Guests can update their own information

### Privacy Controls
```typescript
// Privacy settings interface
interface PrivacySettings {
  allowPhotoTagging: boolean;
  shareContactInfo: boolean;
  receiveUpdates: boolean;
  dataRetentionPeriod: number; // months
}
```

## Row Level Security (RLS) Implementation

### Guest Data Isolation
```sql
-- Guests can only access their own data
CREATE POLICY "guest_own_data" ON guests
FOR ALL USING (
  auth.jwt() ->> 'invitation_code' = invitation_code
);

-- Guests can only see their group members
CREATE POLICY "guest_group_visibility" ON guests
FOR SELECT USING (
  group_id = (
    SELECT group_id FROM guests 
    WHERE invitation_code = auth.jwt() ->> 'invitation_code'
  )
);
```

### Admin Access Controls
```sql
-- Admins have full access with audit logging
CREATE POLICY "admin_full_access" ON guests
FOR ALL USING (
  auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);

-- Log all admin actions
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Input Validation & Sanitization

### Server-Side Validation
```typescript
import { z } from 'zod';

// RSVP form validation
const rsvpSchema = z.object({
  attending: z.boolean(),
  mealPreference: z.enum(['chicken', 'beef', 'fish', 'vegetarian', 'vegan']),
  dietaryRestrictions: z.string().max(500).optional(),
  plusOneName: z.string().max(100).optional(),
  notes: z.string().max(1000).optional()
});

// Sanitize user input
const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
```

### File Upload Security
```typescript
// Secure photo upload validation
const validatePhotoUpload = (file: File): ValidationResult => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxSize) {
    throw new Error('File too large');
  }
  
  // Check for malicious content
  return scanFileForMalware(file);
};
```

## Secure Communication

### HTTPS Enforcement
```typescript
// Next.js security headers
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

### Email Security
```typescript
// Secure email delivery
const sendSecureEmail = async (to: string, template: string, data: any) => {
  // Validate email address
  if (!isValidEmail(to)) {
    throw new Error('Invalid email address');
  }
  
  // Rate limiting
  await checkRateLimit(to);
  
  // Send with encryption
  return await resend.emails.send({
    from: 'noreply@ashtonandcheyenne[domain].com',
    to,
    subject: template.subject,
    html: sanitizeEmailContent(template.html),
    headers: {
      'X-Priority': '3',
      'X-Mailer': 'Ashton & Cheyenne Wedding Website'
    }
  });
};
```

## Data Encryption

### At-Rest Encryption
- **Supabase**: AES-256 encryption for all stored data
- **File Storage**: Encrypted blob storage for photos
- **Backups**: Encrypted automated backups

### In-Transit Encryption
- **TLS 1.3**: All communications encrypted
- **Certificate Pinning**: Prevent man-in-the-middle attacks
- **HSTS**: Force HTTPS connections

### Application-Level Encryption
```typescript
// Encrypt sensitive data before storage
import { encrypt, decrypt } from './crypto-utils';

const storePhoneNumber = async (phone: string, guestId: string) => {
  const encryptedPhone = encrypt(phone, process.env.ENCRYPTION_KEY);
  await supabase
    .from('guests')
    .update({ phone: encryptedPhone })
    .eq('id', guestId);
};
```

## Vulnerability Prevention

### SQL Injection Prevention
```typescript
// Use parameterized queries
const getGuestByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('invitation_code', code) // Parameterized
    .single();
  
  return data;
};
```

### XSS Prevention
```typescript
// Content Security Policy
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.supabase.co;
  frame-ancestors 'none';
`;
```

### CSRF Protection
```typescript
// CSRF token validation
import { getCsrfToken, validateCsrfToken } from 'next-auth/csrf';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const token = req.headers['x-csrf-token'];
    if (!validateCsrfToken(token)) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  // Process request
}
```

## Privacy Compliance

### GDPR Compliance Features
```typescript
// Data subject rights implementation
class PrivacyManager {
  // Right to access
  async exportGuestData(guestId: string): Promise<GuestDataExport> {
    const data = await this.getAllGuestData(guestId);
    return this.formatForExport(data);
  }
  
  // Right to rectification
  async updateGuestData(guestId: string, updates: Partial<Guest>) {
    return await this.validateAndUpdate(guestId, updates);
  }
  
  // Right to erasure
  async deleteGuestData(guestId: string) {
    await this.anonymizeData(guestId);
    await this.scheduleDataDeletion(guestId);
  }
  
  // Right to portability
  async exportDataPortable(guestId: string): Promise<PortableData> {
    return await this.formatForPortability(guestId);
  }
}
```

### Data Retention Policy
```sql
-- Automatic data cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete guests who requested deletion > 30 days ago
  DELETE FROM guests 
  WHERE deletion_requested = true 
    AND deletion_requested_at < NOW() - INTERVAL '30 days';
  
  -- Anonymize old photo uploads
  UPDATE photos 
  SET uploaded_by_guest_id = NULL,
      original_filename = 'anonymous'
  WHERE created_at < NOW() - INTERVAL '2 years';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup job
SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data();');
```

## Security Monitoring

### Audit Logging
```typescript
// Comprehensive audit trail
const auditLog = {
  logAction: async (action: string, userId: string, details: any) => {
    await supabase.from('audit_logs').insert({
      action,
      user_id: userId,
      details,
      ip_address: getClientIP(),
      user_agent: getUserAgent(),
      timestamp: new Date()
    });
  }
};
```

### Security Alerts
```typescript
// Automated security monitoring
const securityMonitor = {
  detectSuspiciousActivity: async (userId: string) => {
    const recentLogins = await getRecentLogins(userId);
    if (recentLogins.length > 10) {
      await sendSecurityAlert('Multiple login attempts', userId);
    }
  },
  
  monitorDataAccess: async (action: string, userId: string) => {
    if (action === 'bulk_export') {
      await sendSecurityAlert('Bulk data export', userId);
    }
  }
};
```

## Incident Response Plan

### Security Breach Protocol
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Determine scope and impact
3. **Containment**: Isolate affected systems
4. **Notification**: Inform affected users within 72 hours
5. **Recovery**: Restore secure operations
6. **Lessons Learned**: Update security measures

### Data Breach Response
```typescript
const breachResponse = {
  assessBreach: async (incident: SecurityIncident) => {
    const affectedUsers = await identifyAffectedUsers(incident);
    const dataTypes = await identifyAffectedData(incident);
    return { affectedUsers, dataTypes, severity: calculateSeverity(incident) };
  },
  
  notifyUsers: async (affectedUsers: string[]) => {
    for (const userId of affectedUsers) {
      await sendBreachNotification(userId);
    }
  }
};
```

This comprehensive security implementation ensures that your wedding website meets enterprise-level security standards while maintaining user-friendly functionality and full compliance with privacy regulations.
