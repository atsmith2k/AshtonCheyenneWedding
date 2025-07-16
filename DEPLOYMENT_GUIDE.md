# Deployment Guide - Ashton & Cheyenne's Wedding Website

## 🚀 Quick Deployment Steps

### 1. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: "ashton-cheyenne-wedding"
3. Choose region closest to your guests
4. Note down project URL and API keys

#### Database Setup
```sql
-- Copy and paste the entire DATABASE_SCHEMA.sql file
-- into Supabase SQL Editor and run it
```

#### Storage Setup
1. Go to Storage in Supabase dashboard
2. Create bucket: `wedding-photos`
3. Set as public bucket
4. Configure policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow public read access to approved photos
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT USING (bucket_id = 'wedding-photos');
```

### 2. Vercel Deployment

#### Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Choose Next.js framework preset
4. Configure environment variables

#### Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://ashtonandcheyenne.vercel.app
NEXT_PUBLIC_SITE_NAME=Ashton & Cheyenne's Wedding

# Admin Configuration
ADMIN_EMAIL=ashton@example.com,cheyenne@example.com

# Email Configuration (Optional for Phase 2)
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_FROM_EMAIL=noreply@ashtonandcheyenne.com
```

#### Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Test the deployed site

### 3. Domain Setup (Optional)

#### Custom Domain
1. Purchase domain (recommended options):
   - ashtonandcheyenne.com
   - ashtonlovescheyenne.com
   - cheyenneandashton.com

2. Configure in Vercel:
   - Go to Project Settings > Domains
   - Add your custom domain
   - Update DNS records as instructed

#### SSL Certificate
- Vercel automatically provides SSL
- No additional configuration needed

## 📊 Initial Data Setup

### Create Test Guest Data
```sql
-- Insert guest groups
INSERT INTO guest_groups (group_name, max_guests) VALUES 
('Immediate Family', 12),
('Extended Family', 25),
('Friends', 30),
('Work Colleagues', 15),
('College Friends', 20);

-- Insert sample guests
INSERT INTO guests (first_name, last_name, email, invitation_code, group_id, plus_one_allowed) VALUES 
('John', 'Smith', 'john@example.com', 'family001', 
 (SELECT id FROM guest_groups WHERE group_name = 'Immediate Family'), true),
('Sarah', 'Johnson', 'sarah@example.com', 'friend001', 
 (SELECT id FROM guest_groups WHERE group_name = 'Friends'), true),
('Mike', 'Davis', 'mike@example.com', 'work001', 
 (SELECT id FROM guest_groups WHERE group_name = 'Work Colleagues'), false);
```

### Add Wedding Information
```sql
-- Insert wedding content
INSERT INTO wedding_info (section, title, content, order_index, published) VALUES 
('welcome', 'Welcome to Our Wedding', 
 '<p>We''re so excited to celebrate our special day with you! This website contains all the information you need for our wedding celebration.</p>', 
 1, true),
('ceremony', 'Wedding Ceremony', 
 '<p>Join us as we exchange vows in an intimate ceremony surrounded by family and friends.</p>
  <p><strong>Date:</strong> [Your Wedding Date]<br>
  <strong>Time:</strong> [Ceremony Time]<br>
  <strong>Location:</strong> [Venue Name and Address]</p>', 
 2, true),
('reception', 'Reception Celebration', 
 '<p>After the ceremony, celebrate with us at our reception! There will be dinner, dancing, and lots of joy.</p>
  <p><strong>Time:</strong> [Reception Time]<br>
  <strong>Location:</strong> [Reception Venue]</p>', 
 3, true);
```

## 🔧 Configuration Options

### Email Service Setup (Future Enhancement)
```bash
# Sign up for Resend (resend.com)
# Add API key to environment variables
# Configure sending domain
```

### Analytics Setup (Optional)
```bash
# Add Google Analytics ID to environment variables
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

### Rich Text Editor (Future Enhancement)
```bash
# Sign up for TinyMCE (tiny.cloud)
# Add API key for rich text editing
NEXT_PUBLIC_TINYMCE_API_KEY=your_tinymce_key
```

## 📱 Mobile Optimization

### PWA Configuration (Optional)
```json
// Add to public/manifest.json
{
  "name": "Ashton & Cheyenne's Wedding",
  "short_name": "A&C Wedding",
  "description": "Wedding website for Ashton and Cheyenne",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ec4899"
}
```

## 🔒 Security Configuration

### Environment Security
- Never commit `.env.local` to git
- Use Vercel environment variables for production
- Rotate API keys regularly

### Database Security
- Enable Row Level Security (RLS) policies
- Use service role key only on server-side
- Validate all user inputs

### File Upload Security
- Limit file types to images only
- Set maximum file size (10MB)
- Scan uploads for malicious content

## 📈 Performance Optimization

### Image Optimization
```javascript
// Next.js automatically optimizes images
// Configure in next.config.js
module.exports = {
  images: {
    domains: ['your-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
}
```

### Caching Strategy
- Static pages cached by Vercel CDN
- API routes cached appropriately
- Database queries optimized

## 🧪 Testing Deployment

### Functionality Tests
1. **Guest Flow:**
   - Visit homepage
   - Enter invitation code: `family001`
   - Submit RSVP
   - Upload photo
   - Send message

2. **Admin Flow:**
   - Visit `/admin/login`
   - Sign in with admin email
   - Check dashboard statistics
   - Review guest RSVPs
   - Moderate photos
   - Respond to messages

### Performance Tests
```bash
# Test page load speeds
curl -w "@curl-format.txt" -o /dev/null -s "https://your-site.vercel.app"

# Test API endpoints
curl "https://your-site.vercel.app/api/wedding-info"
```

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs in Vercel dashboard
# Verify all dependencies are in package.json
# Check TypeScript errors
```

#### Database Connection Issues
```bash
# Verify Supabase URL and keys
# Check RLS policies
# Test connection in Supabase dashboard
```

#### File Upload Issues
```bash
# Check storage bucket permissions
# Verify CORS settings
# Test file size limits
```

## 📞 Support Resources

### Documentation Links
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community Support
- [Next.js Discord](https://discord.gg/nextjs)
- [Supabase Discord](https://discord.supabase.com)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

## ✅ Post-Deployment Checklist

- [ ] Site loads correctly on desktop and mobile
- [ ] All API endpoints respond properly
- [ ] Database connections work
- [ ] File uploads function
- [ ] Admin authentication works
- [ ] Guest invitation flow works
- [ ] RSVP submissions save correctly
- [ ] Photo uploads and moderation work
- [ ] Message system functions
- [ ] SSL certificate is active
- [ ] Custom domain configured (if applicable)
- [ ] Analytics tracking works (if configured)

## 🎉 Go Live!

Once all tests pass and the checklist is complete, your wedding website is ready for guests! Share the URL and invitation codes with your wedding party and guests.

**Congratulations on your beautiful wedding website! 💕**
