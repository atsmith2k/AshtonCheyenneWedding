# Ashton & Cheyenne's Wedding Website - Admin CMS Specification

## Overview
A comprehensive, user-friendly content management system designed specifically for Ashton and Cheyenne to manage their wedding website without technical knowledge. The admin interface provides full control over content, guests, communications, and media.

## Admin Dashboard Architecture

### Main Navigation Structure
```
📊 Dashboard (Overview)
├── 📝 Content Management
│   ├── Wedding Information
│   ├── Event Details
│   ├── Venue & Locations
│   ├── Accommodations
│   └── Registry Information
├── 👥 Guest Management
│   ├── Guest List
│   ├── RSVP Tracking
│   ├── Groups & Families
│   └── Import/Export
├── 📧 Communications
│   ├── Email Templates
│   ├── Send Messages
│   ├── Guest Messages
│   └── FAQ Management
├── 📸 Media Management
│   ├── Photo Library
│   ├── Gallery Management
│   ├── Guest Uploads
│   └── Moderation Queue
├── 📈 Analytics & Reports
│   ├── RSVP Statistics
│   ├── Engagement Metrics
│   ├── Email Analytics
│   └── Export Reports
└── ⚙️ Settings
    ├── Site Configuration
    ├── User Management
    └── Security Settings
```

## 1. Wedding Information Management

### Content Editor Interface
```typescript
interface ContentSection {
  id: string;
  title: string;
  content: string; // Rich text HTML
  order: number;
  published: boolean;
  lastModified: Date;
  version: number;
}

interface WeddingEvent {
  id: string;
  name: string;
  description: string;
  dateTime: Date;
  location: {
    name: string;
    address: string;
    coordinates?: { lat: number; lng: number };
    parkingInfo?: string;
    accessibilityInfo?: string;
  };
  dressCode?: string;
  specialInstructions?: string;
  published: boolean;
}
```

### Rich Text Editor Features
- **WYSIWYG Editor**: TinyMCE or similar with wedding-specific toolbar
- **Formatting Options**: Headers, bold, italic, lists, links, colors
- **Media Integration**: Insert images directly from media library
- **Link Management**: Easy linking to other sections or external sites
- **Mobile Preview**: See how content appears on mobile devices
- **Auto-save**: Prevent content loss with automatic saving
- **Version History**: Track and revert content changes

### Event Management Interface
```jsx
// Event Editor Component
const EventEditor = () => {
  return (
    <div className="event-editor">
      <div className="event-header">
        <input type="text" placeholder="Event Name" />
        <toggle label="Published" />
      </div>
      
      <div className="event-details">
        <RichTextEditor placeholder="Event Description" />
        
        <div className="datetime-picker">
          <DatePicker label="Date" />
          <TimePicker label="Time" />
        </div>
        
        <div className="location-editor">
          <input type="text" placeholder="Venue Name" />
          <textarea placeholder="Full Address" />
          <MapPicker /> {/* Interactive map for coordinates */}
        </div>
        
        <div className="additional-info">
          <input type="text" placeholder="Dress Code" />
          <textarea placeholder="Special Instructions" />
          <textarea placeholder="Parking Information" />
        </div>
      </div>
      
      <div className="preview-section">
        <button>Preview Changes</button>
        <button>Save Draft</button>
        <button>Publish</button>
      </div>
    </div>
  );
};
```

## 2. Guest Management Tools

### Bulk Import/Export System
```typescript
interface GuestImportFormat {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  groupName: string;
  plusOneAllowed: boolean;
  mealPreference?: string;
  dietaryRestrictions?: string;
  address?: string;
  notes?: string;
}

// CSV Import/Export functionality
const importGuests = async (csvFile: File) => {
  const guests = await parseCSV(csvFile);
  return await validateAndImportGuests(guests);
};

const exportGuests = async (filters?: GuestFilters) => {
  const guests = await getFilteredGuests(filters);
  return generateCSV(guests);
};
```

### Guest Management Interface
```jsx
const GuestManagement = () => {
  return (
    <div className="guest-management">
      <div className="guest-toolbar">
        <SearchBar placeholder="Search guests..." />
        <FilterDropdown options={['All', 'Attending', 'Not Attending', 'Pending']} />
        <button>Import CSV</button>
        <button>Export Data</button>
        <button>Add Guest</button>
      </div>
      
      <div className="guest-stats">
        <StatCard title="Total Invited" value={totalGuests} />
        <StatCard title="Attending" value={attendingCount} />
        <StatCard title="Not Attending" value={notAttendingCount} />
        <StatCard title="Pending RSVP" value={pendingCount} />
      </div>
      
      <div className="guest-table">
        <DataTable
          columns={['Name', 'Email', 'Group', 'RSVP Status', 'Meal', 'Plus One', 'Actions']}
          data={guests}
          sortable={true}
          pagination={true}
          bulkActions={['Send Reminder', 'Export Selected', 'Delete']}
        />
      </div>
      
      <GuestEditModal />
      <GroupManagementModal />
    </div>
  );
};
```

### Group Management Features
- **Family Grouping**: Automatically group family members
- **Plus-One Management**: Set allowances per guest or group
- **Meal Tracking**: Track dietary preferences and restrictions
- **Address Management**: Store addresses for save-the-dates
- **Custom Fields**: Add custom data fields as needed

## 3. Communication Management

### Email Template Editor
```typescript
interface EmailTemplate {
  id: string;
  name: string;
  type: 'invitation' | 'reminder' | 'update' | 'thank_you';
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[]; // Available merge fields
  previewData: Record<string, any>;
  lastModified: Date;
}

// Template variables available for merge
const templateVariables = {
  guest: ['firstName', 'lastName', 'fullName', 'email'],
  wedding: ['date', 'time', 'venue', 'address'],
  rsvp: ['rsvpLink', 'deadline', 'status'],
  custom: ['personalMessage', 'specialInstructions']
};
```

### Email Campaign Management
```jsx
const EmailCampaign = () => {
  return (
    <div className="email-campaign">
      <div className="campaign-setup">
        <select>
          <option>Select Template</option>
          <option>Wedding Invitation</option>
          <option>RSVP Reminder</option>
          <option>Wedding Update</option>
        </select>
        
        <div className="recipient-selection">
          <h3>Send To:</h3>
          <checkbox label="All Guests" />
          <checkbox label="Pending RSVPs Only" />
          <checkbox label="Attending Guests" />
          <MultiSelect options={guestGroups} label="Specific Groups" />
        </div>
        
        <div className="scheduling">
          <radio name="send" value="now" label="Send Now" />
          <radio name="send" value="scheduled" label="Schedule for Later" />
          <DateTimePicker />
        </div>
      </div>
      
      <div className="email-preview">
        <h3>Preview</h3>
        <div className="preview-controls">
          <select>
            <option>Preview as: John & Jane Doe</option>
          </select>
        </div>
        <EmailPreview template={selectedTemplate} data={previewData} />
      </div>
      
      <div className="campaign-actions">
        <button>Save Draft</button>
        <button>Send Test Email</button>
        <button>Send Campaign</button>
      </div>
    </div>
  );
};
```

### Guest Message Management
```jsx
const MessageManagement = () => {
  return (
    <div className="message-management">
      <div className="message-filters">
        <FilterTabs options={['New', 'In Progress', 'Responded', 'Archived']} />
        <SearchBar placeholder="Search messages..." />
      </div>
      
      <div className="message-list">
        {messages.map(message => (
          <MessageCard
            key={message.id}
            guest={message.guest}
            subject={message.subject}
            preview={message.preview}
            timestamp={message.createdAt}
            status={message.status}
            urgent={message.isUrgent}
            onClick={() => openMessageDetail(message)}
          />
        ))}
      </div>
      
      <MessageDetailModal
        message={selectedMessage}
        onReply={handleReply}
        onMarkResolved={handleMarkResolved}
      />
    </div>
  );
};
```

## 4. Media Management System

### Photo Library Interface
```typescript
interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  thumbnailUrl: string;
  size: number;
  mimeType: string;
  uploadedBy: 'admin' | 'guest';
  uploadedByGuestId?: string;
  approved: boolean;
  featured: boolean;
  tags: string[];
  caption?: string;
  album?: string;
  uploadedAt: Date;
}

interface PhotoGallery {
  id: string;
  name: string;
  description: string;
  coverPhoto: string;
  photos: MediaItem[];
  published: boolean;
  order: number;
}
```

### Media Management Interface
```jsx
const MediaManagement = () => {
  return (
    <div className="media-management">
      <div className="media-toolbar">
        <button>Upload Photos</button>
        <button>Create Album</button>
        <FilterDropdown options={['All', 'Approved', 'Pending', 'Guest Uploads']} />
        <ViewToggle options={['Grid', 'List']} />
      </div>
      
      <div className="upload-area">
        <DragDropUpload
          accept="image/*"
          multiple={true}
          onUpload={handlePhotoUpload}
          maxSize="10MB"
        />
      </div>
      
      <div className="media-grid">
        {photos.map(photo => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onApprove={handleApprove}
            onReject={handleReject}
            onEdit={handleEdit}
            onDelete={handleDelete}
            selectable={true}
          />
        ))}
      </div>
      
      <div className="bulk-actions">
        <button disabled={!selectedPhotos.length}>
          Approve Selected ({selectedPhotos.length})
        </button>
        <button disabled={!selectedPhotos.length}>
          Reject Selected
        </button>
        <button disabled={!selectedPhotos.length}>
          Add to Album
        </button>
      </div>
      
      <PhotoEditModal />
      <AlbumManagementModal />
    </div>
  );
};
```

### Guest Photo Moderation Workflow
```jsx
const PhotoModerationQueue = () => {
  return (
    <div className="moderation-queue">
      <div className="queue-stats">
        <StatCard title="Pending Approval" value={pendingCount} />
        <StatCard title="Approved Today" value={approvedToday} />
        <StatCard title="Total Guest Photos" value={totalGuestPhotos} />
      </div>
      
      <div className="moderation-list">
        {pendingPhotos.map(photo => (
          <ModerationCard
            key={photo.id}
            photo={photo}
            guestInfo={photo.uploadedByGuest}
            onApprove={() => approvePhoto(photo.id)}
            onReject={() => rejectPhoto(photo.id)}
            onRequestChanges={() => requestChanges(photo.id)}
          />
        ))}
      </div>
    </div>
  );
};
```

## 5. Analytics & Reporting Dashboard

### Analytics Interface
```typescript
interface AnalyticsData {
  rsvpStats: {
    totalInvited: number;
    attending: number;
    notAttending: number;
    pending: number;
    responseRate: number;
  };
  
  emailMetrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    openRate: number;
    clickRate: number;
  };
  
  engagementMetrics: {
    pageViews: number;
    uniqueVisitors: number;
    averageSessionDuration: number;
    photoUploads: number;
    messagesReceived: number;
  };
  
  timeSeriesData: {
    rsvpTrend: Array<{ date: string; count: number }>;
    trafficTrend: Array<{ date: string; visitors: number }>;
  };
}
```

### Dashboard Components
```jsx
const AnalyticsDashboard = () => {
  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h1>Wedding Analytics</h1>
        <DateRangePicker />
        <button>Export Report</button>
      </div>
      
      <div className="metrics-grid">
        <MetricCard
          title="RSVP Response Rate"
          value={`${analytics.rsvpStats.responseRate}%`}
          trend={rsvpTrend}
          color="blue"
        />
        <MetricCard
          title="Email Open Rate"
          value={`${analytics.emailMetrics.openRate}%`}
          trend={emailTrend}
          color="green"
        />
        <MetricCard
          title="Website Visitors"
          value={analytics.engagementMetrics.uniqueVisitors}
          trend={trafficTrend}
          color="purple"
        />
        <MetricCard
          title="Photos Uploaded"
          value={analytics.engagementMetrics.photoUploads}
          trend={photoTrend}
          color="orange"
        />
      </div>
      
      <div className="charts-section">
        <div className="chart-container">
          <h3>RSVP Timeline</h3>
          <LineChart data={analytics.timeSeriesData.rsvpTrend} />
        </div>
        <div className="chart-container">
          <h3>Guest Engagement</h3>
          <BarChart data={engagementData} />
        </div>
      </div>
      
      <div className="detailed-reports">
        <ReportTable
          title="Guest RSVP Details"
          data={guestRsvpData}
          exportable={true}
        />
        <ReportTable
          title="Email Campaign Performance"
          data={emailCampaignData}
          exportable={true}
        />
      </div>
    </div>
  );
};
```

## 6. Mobile-Responsive Admin Interface

### Responsive Design Considerations
- **Touch-Friendly**: Large buttons and touch targets (44px minimum)
- **Simplified Navigation**: Collapsible sidebar for mobile
- **Optimized Forms**: Mobile-friendly form inputs and validation
- **Image Handling**: Mobile photo upload with camera integration
- **Offline Capability**: Basic offline functionality for critical tasks

### Mobile Admin Features
```jsx
const MobileAdminNav = () => {
  return (
    <div className="mobile-admin-nav">
      <div className="nav-header">
        <button className="menu-toggle">☰</button>
        <h1>Admin</h1>
        <NotificationBadge count={unreadCount} />
      </div>
      
      <div className="quick-actions">
        <QuickActionButton icon="📧" label="Messages" count={newMessages} />
        <QuickActionButton icon="📸" label="Photos" count={pendingPhotos} />
        <QuickActionButton icon="📊" label="RSVPs" count={pendingRsvps} />
      </div>
      
      <CollapsibleSidebar>
        <NavItem icon="📊" label="Dashboard" />
        <NavItem icon="📝" label="Content" />
        <NavItem icon="👥" label="Guests" />
        <NavItem icon="📧" label="Communications" />
        <NavItem icon="📸" label="Media" />
        <NavItem icon="📈" label="Analytics" />
      </CollapsibleSidebar>
    </div>
  );
};
```

This comprehensive admin CMS specification ensures that Ashton and Cheyenne have complete control over their wedding website with an intuitive, powerful interface that requires no technical knowledge to operate effectively.
