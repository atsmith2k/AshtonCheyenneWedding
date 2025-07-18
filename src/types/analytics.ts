/**
 * Centralized analytics type definitions for the wedding website admin dashboard
 */

// Main dashboard statistics interface
export interface DashboardStats {
  totalGuests: number
  attending: number
  notAttending: number
  pending: number
  responseRate: number
  emailsSent: number
  emailOpenRate: number
  emailDeliveryRate: number
  photosUploaded: number
  photosApproved: number
  pendingPhotos: number
  newMessages: number
  urgentMessages: number
}

// RSVP Analytics (matches existing API)
export interface RSVPAnalytics {
  overview: {
    total: number
    attending: number
    notAttending: number
    pending: number
    responseRate: number
    completionRate: number
  }
  meals: {
    totalMeals: number
    breakdown: Record<string, number>
  }
  plusOnes: {
    allowed: number
    confirmed: number
    rate: number
  }
  dietaryRestrictions: {
    total: number
    rate: number
    topRestrictions: Array<{ restriction: string; count: number }>
  }
  timeline: {
    recentResponses: number
    dailyBreakdown: Record<string, number>
  }
}

// Email Analytics (matches existing API)
export interface EmailAnalytics {
  overview: {
    total_campaigns: number
    total_emails_sent: number
    total_delivered: number
    total_opened: number
    total_clicked: number
    total_bounced: number
    delivery_rate: number
    open_rate: number
    click_rate: number
    bounce_rate: number
  }
  chart_data: Array<{
    date: string
    sent: number
    delivered: number
    opened: number
    clicked: number
  }>
  campaign_performance: Array<{
    id: string
    name: string
    sent_count: number
    delivered_count: number
    opened_count: number
    clicked_count: number
    delivery_rate: number
    open_rate: number
    click_rate: number
  }>
  template_stats: Array<{
    id: string
    subject: string
    template_type: string
    campaigns_count: number
    total_sent: number
    avg_open_rate: number
    avg_click_rate: number
  }>
  recent_activity: Array<{
    id: string
    action: string
    details: string
    timestamp: string
  }>
}

// Photo Analytics (new)
export interface PhotoAnalytics {
  overview: {
    total_photos: number
    approved_photos: number
    pending_photos: number
    rejected_photos: number
    approval_rate: number
    total_file_size: number
    average_file_size: number
  }
  uploads: {
    guest_uploads: number
    admin_uploads: number
    recent_uploads_7_days: number
    uploads_by_day: Record<string, number>
  }
  moderation: {
    pending_review: number
    auto_approved: number
    manual_approved: number
    rejected: number
    average_review_time_hours: number
  }
  albums: {
    total_albums: number
    published_albums: number
    photos_per_album: Record<string, number>
  }
  featured: {
    featured_photos: number
    featured_rate: number
  }
}

// Message Analytics (new)
export interface MessageAnalytics {
  overview: {
    total_messages: number
    new_messages: number
    responded_messages: number
    archived_messages: number
    urgent_messages: number
    response_rate: number
    average_response_time_hours: number
  }
  timeline: {
    messages_by_day: Record<string, number>
    recent_messages_7_days: number
    peak_messaging_day: string
  }
  categories: {
    urgent_count: number
    general_count: number
    response_needed: number
    informational: number
  }
  guest_engagement: {
    unique_guests_messaging: number
    repeat_messagers: number
    average_messages_per_guest: number
  }
}

// Guest Analytics (matches existing API structure)
export interface GuestAnalytics {
  totalGuests: number
  totalGroups: number
  rsvp: {
    attending: number
    notAttending: number
    pending: number
    responseRate: number
  }
  meals: {
    chicken: number
    beef: number
    fish: number
    vegetarian: number
    vegan: number
    kidsMenu: number
    notSpecified: number
  }
  plusOnes: {
    allowed: number
    withNames: number
    notAllowed: number
  }
  dietaryRestrictions: {
    withRestrictions: number
    withoutRestrictions: number
  }
  contactInfo: {
    withEmail: number
    withPhone: number
    withBoth: number
    withNeither: number
  }
  groupBreakdown: Array<{
    groupName: string
    total: number
    attending: number
    notAttending: number
    pending: number
  }>
  timeline: {
    recentRSVPs: Array<{
      guestName: string
      rsvpStatus: string
      submittedAt: string
    }>
    rsvpsByDay: Record<string, number>
  }
}

// Invitation Analytics (matches existing API)
export interface InvitationAnalytics {
  overview: {
    total_guests: number
    guests_with_email: number
    guests_without_email: number
    invitations_sent: number
    invitations_not_sent: number
    response_rate_percentage: number
    recent_invitations_7_days: number
  }
  invitation_status: {
    sent_and_responded: number
    sent_but_pending: number
    not_sent: number
    no_email: number
  }
  rsvp_breakdown: {
    attending: number
    not_attending: number
    pending: number
  }
  percentages: {
    invitation_coverage: number
    response_rate: number
    email_coverage: number
  }
}

// API Response wrapper types
export interface AnalyticsApiResponse<T> {
  success: boolean
  data?: T
  analytics?: T
  error?: string
}

// Mobile dashboard specific stats
export interface MobileDashboardStats {
  totalGuests: number
  rsvpResponses: number
  pendingRsvps: number
  attendingGuests: number
  photosUploaded: number
  pendingPhotos: number
  messagesReceived: number
  daysUntilWedding: number
}
