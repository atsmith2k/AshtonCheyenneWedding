# Ashton & Cheyenne's Wedding Website Cost Analysis & Scalability

## Cost Breakdown by Service

### Supabase Database & Storage
**Free Tier Limits:**
- Database: 500MB storage
- File Storage: 1GB
- Monthly Active Users: 50,000
- API Requests: 50,000 per month
- Realtime connections: 200 concurrent

**Typical Wedding Usage:**
- Database: ~50-100MB (100-300 guests)
- File Storage: 200-800MB (photos)
- Monthly Active Users: 50-300 (guests + family)
- API Requests: 5,000-15,000/month

**Cost Projection:**
- **Free Tier**: $0/month (covers 95% of weddings)
- **Pro Tier**: $25/month (if needed for large weddings 300+ guests)

### Vercel Hosting
**Hobby Plan (Free):**
- 100GB bandwidth/month
- 6,000 build minutes/month
- Unlimited static sites
- Custom domains

**Typical Wedding Usage:**
- Bandwidth: 10-50GB/month
- Build minutes: 100-500/month
- Perfect for wedding websites

**Cost Projection:**
- **Hobby Plan**: $0/month (sufficient for most weddings)
- **Pro Plan**: $20/month (only if heavy traffic expected)

### Email Service (Resend)
**Free Tier:**
- 3,000 emails/month
- 100 emails/day

**Typical Wedding Usage:**
- Invitations: 100-300 emails
- RSVP confirmations: 100-300 emails
- Reminders: 50-150 emails
- Updates: 100-500 emails
- **Total**: 350-1,250 emails

**Cost Projection:**
- **Free Tier**: $0/month (covers most weddings)
- **Paid Plan**: $20/month (for 50,000 emails if extensive communication needed)

### Domain Registration
**Annual Cost:**
- .com domain: $12-15/year (ashtonandcheyenne.com)
- .wedding domain: $30-40/year (ashtonandcheyenne.wedding)
- .love domain: $25-35/year (ashtonandcheyenne.love)

**Recommendation:** Standard .com domain for reliability and easy recall

### Total Monthly Costs

#### Small Wedding (50-100 guests)
- Supabase: $0
- Vercel: $0
- Email: $0
- Domain: $1.25/month ($15/year)
- **Total: $1.25/month**

#### Medium Wedding (100-200 guests)
- Supabase: $0
- Vercel: $0
- Email: $0
- Domain: $1.25/month
- **Total: $1.25/month**

#### Large Wedding (200-300 guests)
- Supabase: $0-25 (may need Pro tier)
- Vercel: $0-20 (may need Pro for traffic)
- Email: $0-20 (may need paid plan)
- Domain: $1.25/month
- **Total: $1.25-66.25/month**

#### Very Large Wedding (300+ guests)
- Supabase: $25 (Pro tier recommended)
- Vercel: $20 (Pro tier for performance)
- Email: $20 (paid plan for volume)
- Domain: $1.25/month
- **Total: $66.25/month**

## Scalability Analysis

### Database Scalability

#### Guest Capacity by Tier
**Free Tier (500MB):**
- Supports: 500-1,000 guests comfortably
- Includes: Full RSVP data, messages, basic photos metadata

**Pro Tier (8GB):**
- Supports: 5,000+ guests
- Includes: Extensive photo metadata, detailed analytics

#### Storage Scalability
**Free Tier (1GB):**
- Photo storage: 200-1,000 photos (depending on compression)
- Document storage: Wedding programs, maps, etc.

**Pro Tier (100GB):**
- Photo storage: 10,000+ high-resolution photos
- Video storage: Wedding videos and clips

### Performance Scalability

#### Concurrent Users
**Free Tier:**
- 200 concurrent realtime connections
- Handles: Wedding day traffic spikes well

**Pro Tier:**
- 500 concurrent connections
- Handles: Large wedding live updates

#### API Performance
**Free Tier:**
- 50,000 requests/month
- Typical usage: 5,000-15,000 requests
- Headroom: 3-10x capacity

**Pro Tier:**
- 5,000,000 requests/month
- Massive headroom for any wedding size

### Traffic Scalability

#### Vercel Performance
**Hobby Plan:**
- Global CDN
- Automatic scaling
- 100GB bandwidth/month
- Handles traffic spikes automatically

**Expected Traffic Patterns for Ashton & Cheyenne's Wedding:**
- Pre-wedding: Moderate steady traffic
- Wedding week: 2-3x traffic increase
- Wedding day: 5-10x traffic spike
- Post-wedding: Gradual decline

#### Bandwidth Usage
**Typical Patterns:**
- RSVP period: 5-15GB/month
- Wedding week: 20-40GB/month
- Wedding day: 10-30GB (photo uploads)
- Post-wedding: 5-20GB/month

## Cost Optimization Strategies

### 1. Image Optimization
```typescript
// Automatic image compression
const optimizedImage = await sharp(buffer)
  .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 85 })
  .toBuffer();
```

**Benefits:**
- Reduces storage costs by 60-80%
- Improves loading performance
- Extends free tier capacity

### 2. Efficient Database Queries
```sql
-- Use indexes for common queries
CREATE INDEX idx_guests_rsvp_status ON guests(rsvp_status);

-- Limit data fetching
SELECT id, first_name, last_name, rsvp_status 
FROM guests 
WHERE group_id = $1;
```

**Benefits:**
- Reduces API request count
- Improves response times
- Minimizes database load

### 3. Caching Strategy
```typescript
// Static generation for wedding info
export async function getStaticProps() {
  const weddingInfo = await getWeddingInfo();
  return {
    props: { weddingInfo },
    revalidate: 3600 // 1 hour
  };
}
```

**Benefits:**
- Reduces database queries
- Improves performance
- Lowers hosting costs

### 4. Smart Email Management
```typescript
// Batch email sending
const batchSize = 50;
for (let i = 0; i < guests.length; i += batchSize) {
  const batch = guests.slice(i, i + batchSize);
  await sendBatchEmails(batch);
  await delay(1000); // Rate limiting
}
```

**Benefits:**
- Stays within free tier limits
- Avoids rate limiting
- Ensures delivery reliability

## Upgrade Triggers

### When to Upgrade Supabase
- Database size > 400MB
- File storage > 800MB
- Monthly active users > 40,000
- Need for advanced analytics

### When to Upgrade Vercel
- Bandwidth usage > 80GB/month
- Need for team collaboration
- Advanced analytics requirements
- Custom deployment workflows

### When to Upgrade Email Service
- Sending > 2,500 emails/month
- Need for advanced templates
- Require detailed analytics
- Want dedicated IP

## Long-term Cost Projections

### Pre-Wedding (6 months)
- Setup and development: $0-10/month
- Testing and refinement: $0-10/month
- **Average: $5/month**

### Wedding Period (3 months)
- Active guest engagement: $0-30/month
- High traffic and usage: $10-50/month
- **Average: $20/month**

### Post-Wedding (ongoing)
- Photo sharing and memories: $0-15/month
- Reduced activity: $0-10/month
- **Average: $5/month**

### Annual Total Cost Estimate
- Small wedding: $50-100/year
- Medium wedding: $100-200/year
- Large wedding: $200-500/year
- Very large wedding: $500-800/year

## ROI Considerations

### Cost Savings vs Traditional Methods
- **Professional wedding website**: $500-2,000
- **RSVP management service**: $100-300
- **Photo sharing platform**: $50-200
- **Guest communication**: $100-500

**Total Traditional Cost**: $750-3,000
**Our Solution Cost**: $50-800/year
**Savings**: $700-2,200+ (70-90% cost reduction)

### Additional Benefits
- Complete customization control
- No vendor lock-in
- Scalable architecture
- Modern technology stack
- Professional development experience
- Reusable for future events

This cost analysis demonstrates that the proposed architecture provides enterprise-level capabilities at consumer-friendly prices, making it an excellent choice for budget-conscious couples who don't want to compromise on quality or features.
