# Ashton & Cheyenne's Wedding Website - Admin Interface Wireframes

## Dashboard Overview Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏠 Ashton & Cheyenne's Wedding Admin                    👤 Admin ▼ 🔔 (3)  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 📊 Dashboard │ 📝 Content │ 👥 Guests │ 📧 Communications │ 📸 Media │ 📈 Analytics │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌─── Quick Stats ────────────────────────────────────────────────────────┐  │
│ │ 📊 150 Total Guests  │ ✅ 89 Attending  │ ❌ 12 Not Attending  │ ⏳ 49 Pending │  │
│ │ 📧 95% Email Delivered │ 📸 47 Photos Pending │ 💬 3 New Messages        │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─── Recent Activity ──────────────┐ ┌─── RSVP Timeline ─────────────────┐  │
│ │ 🔔 New message from John Smith   │ │     📈 [Chart showing RSVP trend] │  │
│ │ 📸 5 photos uploaded by guests   │ │                                   │  │
│ │ ✅ Sarah Johnson RSVP'd Yes      │ │                                   │  │
│ │ 📧 Reminder emails sent (25)     │ │                                   │  │
│ └───────────────────────────────────┘ └───────────────────────────────────┘  │
│                                                                             │
│ ┌─── Quick Actions ────────────────────────────────────────────────────────┐  │
│ │ [📧 Send Reminder] [📝 Update Info] [📸 Review Photos] [👥 Add Guests]   │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Content Management Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📝 Content Management                                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Sections ─┐ ┌─────────── Content Editor ──────────────────────────────┐  │
│ │ ✏️ Welcome  │ │ Section: Welcome                    [📄 Preview] [💾 Save] │  │
│ │ 💒 Ceremony │ │ ┌─────────────────────────────────────────────────────┐ │  │
│ │ 🎉 Reception│ │ │ Title: Welcome to Ashton & Cheyenne's Wedding      │ │  │
│ │ 🏨 Hotels   │ │ └─────────────────────────────────────────────────────┘ │  │
│ │ ✈️ Travel   │ │                                                         │  │
│ │ 🎁 Registry │ │ Rich Text Editor:                                       │  │
│ │             │ │ ┌─ B I U ─ 📷 🔗 📋 ─ H1 H2 H3 ─ • 1. ─ ↶ ↷ ────┐ │  │
│ │ [+ Add]     │ │ │ Welcome to our wedding website! We're so excited  │ │  │
│ │             │ │ │ to celebrate our special day with you.             │ │  │
│ │             │ │ │                                                    │ │  │
│ │             │ │ │ Join us as we say "I Do" and begin our journey    │ │  │
│ │             │ │ │ as husband and wife. This website contains all    │ │  │
│ │             │ │ │ the information you need for our wedding.         │ │  │
│ │             │ │ └────────────────────────────────────────────────────┘ │  │
│ │             │ │                                                         │  │
│ │             │ │ ☑️ Published  📅 Last updated: 2 hours ago             │  │
│ │             │ │ 🏷️ SEO Keywords: wedding, celebration, love            │  │
│ └─────────────┘ └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Guest Management Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 👥 Guest Management                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [🔍 Search guests...] [📊 All ▼] [📤 Import CSV] [📥 Export] [➕ Add Guest] │
│                                                                             │
│ ┌─── Guest Statistics ─────────────────────────────────────────────────────┐  │
│ │ 📊 150 Total │ ✅ 89 Attending │ ❌ 12 Not Attending │ ⏳ 49 Pending     │  │
│ │ 🍽️ 65 Chicken │ 🥩 24 Beef │ 🐟 15 Fish │ 🥗 20 Vegetarian │ 🌱 5 Vegan  │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐  │
│ │ ☑️ │ Name ↕️        │ Email              │ Group      │ RSVP    │ Meal    │ Actions │
│ ├───┼────────────────┼────────────────────┼────────────┼─────────┼─────────┼─────────┤
│ │ ☑️ │ John Smith     │ john@email.com     │ Family     │ ✅ Yes   │ 🍗 Chicken│ ✏️ 📧 🗑️ │
│ │ ☑️ │ Jane Smith     │ jane@email.com     │ Family     │ ✅ Yes   │ 🥩 Beef  │ ✏️ 📧 🗑️ │
│ │ ☑️ │ Bob Johnson    │ bob@email.com      │ Friends    │ ⏳ Pending│ -       │ ✏️ 📧 🗑️ │
│ │ ☑️ │ Sarah Wilson   │ sarah@email.com    │ Work       │ ❌ No    │ -       │ ✏️ 📧 🗑️ │
│ │ ☑️ │ Mike Davis     │ mike@email.com     │ College    │ ✅ Yes   │ 🐟 Fish  │ ✏️ 📧 🗑️ │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ [📧 Send Reminder to Selected] [📤 Export Selected] [🗑️ Delete Selected]    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Email Campaign Management

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📧 Email Campaign Management                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─ Templates ─┐ ┌─────────── Campaign Setup ──────────────────────────────┐  │
│ │ 💌 Invitation│ │ Template: Wedding Invitation                           │  │
│ │ 🔔 Reminder  │ │ ┌─────────────────────────────────────────────────────┐ │  │
│ │ 📰 Update    │ │ │ Subject: You're Invited to Ashton & Cheyenne's... │ │  │
│ │ 🙏 Thank You │ │ └─────────────────────────────────────────────────────┘ │  │
│ │              │ │                                                         │  │
│ │ [+ New]      │ │ Send To:                                               │  │
│ │              │ │ ☑️ All Guests (150)                                     │  │
│ │              │ │ ☐ Pending RSVPs Only (49)                             │  │
│ │              │ │ ☐ Attending Guests (89)                               │  │
│ │              │ │ ☐ Specific Groups: [Family ▼] [Friends ▼]             │  │
│ │              │ │                                                         │  │
│ │              │ │ Schedule:                                              │  │
│ │              │ │ ⚪ Send Now  ⚫ Schedule: [📅 Date] [🕐 Time]           │  │
│ │              │ │                                                         │  │
│ │              │ │ [👁️ Preview] [📧 Send Test] [🚀 Send Campaign]         │  │
│ └─────────────┘ └─────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─── Email Preview ────────────────────────────────────────────────────────┐  │
│ │ Preview as: [John & Jane Smith ▼]                                       │  │
│ │ ┌─────────────────────────────────────────────────────────────────────┐ │  │
│ │ │ From: Ashton & Cheyenne <noreply@ashtonandcheyenne.com>            │ │  │
│ │ │ To: John & Jane Smith                                               │ │  │
│ │ │ Subject: You're Invited to Ashton & Cheyenne's Wedding! 💕         │ │  │
│ │ │                                                                     │ │  │
│ │ │ Dear John & Jane,                                                   │ │  │
│ │ │                                                                     │ │  │
│ │ │ We're thrilled to invite you to celebrate our special day!         │ │  │
│ │ │ [Rest of email content...]                                          │ │  │
│ │ └─────────────────────────────────────────────────────────────────────┘ │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Photo Management Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📸 Photo Management                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📤 Upload] [📁 Create Album] [🔍 All Photos ▼] [🎯 Grid View ▼] [☑️ Select All] │
│                                                                             │
│ ┌─── Upload Area ──────────────────────────────────────────────────────────┐  │
│ │     📤 Drag & Drop Photos Here or Click to Browse                       │  │
│ │        Supports: JPG, PNG, WEBP • Max 10MB per file                     │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─── Moderation Queue (5 pending) ────────────────────────────────────────┐  │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                                │  │
│ │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │                                │  │
│ │ │Guest│ │Guest│ │Guest│ │Guest│ │Guest│                                │  │
│ │ │Photo│ │Photo│ │Photo│ │Photo│ │Photo│                                │  │
│ │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘                                │  │
│ │ [✅ Approve All] [❌ Reject All] [👁️ Review Individual]                  │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─── Photo Library ────────────────────────────────────────────────────────┐  │
│ │ Albums: [All Photos] [Engagement] [Ceremony] [Reception] [+ New Album]   │  │
│ │                                                                          │  │
│ │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │  │
│ │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │         │  │
│ │ │ ⭐  │ │     │ │     │ │ ⭐  │ │     │ │     │ │     │ │     │         │  │
│ │ │ ✅  │ │ ✅  │ │ ✅  │ │ ✅  │ │ ✅  │ │ ✅  │ │ ✅  │ │ ✅  │         │  │
│ │ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘         │  │
│ │                                                                          │  │
│ │ Selected: 3 photos                                                       │  │
│ │ [⭐ Feature] [📁 Move to Album] [🗑️ Delete] [📥 Download]                │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Analytics Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📈 Analytics & Reports                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│ [📅 Last 30 Days ▼] [📊 Export Report]                                     │
│                                                                             │
│ ┌─── Key Metrics ──────────────────────────────────────────────────────────┐  │
│ │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │  │
│ │ │ RSVP Rate   │ │ Email Opens │ │ Site Visits │ │ Photo Uploads│         │  │
│ │ │    89%      │ │    94%      │ │    1,247    │ │     156     │         │  │
│ │ │ ↗️ +5% vs LW │ │ ↗️ +2% vs LW │ │ ↗️ +15% vs LW│ │ ↗️ +23 vs LW │         │  │
│ │ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘         │  │
│ └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│ ┌─── RSVP Timeline ──────────────┐ ┌─── Email Performance ─────────────────┐  │
│ │     📈                         │ │ Campaign          │ Sent │ Opened │ CTR │  │
│ │    /                           │ │ ─────────────────┼──────┼────────┼─────│  │
│ │   /                            │ │ Save the Dates   │  150 │  94%   │ 12% │  │
│ │  /                             │ │ Invitations      │  150 │  96%   │ 89% │  │
│ │ /                              │ │ RSVP Reminders   │   49 │  87%   │ 65% │  │
│ │/___________________________    │ │ Wedding Updates  │  150 │  91%   │ 23% │  │
│ │Jan  Feb  Mar  Apr  May  Jun    │ └───────────────────────────────────────┘  │
│ └────────────────────────────────┘                                          │
│                                                                             │
│ ┌─── Guest Engagement ───────────┐ ┌─── Top Pages ──────────────────────────┐  │
│ │ Most Active Guests:            │ │ Page              │ Views │ Avg Time   │  │
│ │ • Sarah Johnson (15 visits)    │ │ ─────────────────┼───────┼────────────│  │
│ │ • Mike Davis (12 visits)       │ │ Home             │  1,247│ 2m 34s     │  │
│ │ • Lisa Brown (11 visits)       │ │ RSVP             │    892│ 4m 12s     │  │
│ │ • John Smith (9 visits)        │ │ Wedding Info     │    654│ 3m 45s     │  │
│ │ • Amy Wilson (8 visits)        │ │ Photo Gallery    │    423│ 5m 23s     │  │
│ └────────────────────────────────┘ └───────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Admin Interface

```
┌─────────────────────────┐
│ ☰ Admin    🔔(3)  👤    │
├─────────────────────────┤
│ ┌─ Quick Stats ────────┐ │
│ │ 📊 150 👥 89 ✅ 49 ⏳ │ │
│ │ 📧 95% 📸 47 💬 3    │ │
│ └─────────────────────┘ │
│                         │
│ ┌─ Quick Actions ─────┐ │
│ │ [📧 Messages (3)]   │ │
│ │ [📸 Photos (47)]    │ │
│ │ [📊 RSVPs (49)]     │ │
│ │ [📝 Edit Content]   │ │
│ └───────────────────┘ │
│                         │
│ ┌─ Recent Activity ───┐ │
│ │ 🔔 New message      │ │
│ │ 📸 5 photos uploaded│ │
│ │ ✅ Sarah RSVP'd     │ │
│ │ 📧 25 emails sent   │ │
│ └───────────────────┘ │
│                         │
│ [📊] [📝] [👥] [📧] [📸] │
└─────────────────────────┘
```

These wireframes provide a comprehensive visual guide for implementing the admin CMS interface, ensuring Ashton and Cheyenne have intuitive, powerful tools to manage their wedding website effectively.
