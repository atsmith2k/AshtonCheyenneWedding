'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MobileDashboard } from '@/components/admin/mobile-dashboard'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import {
  DashboardStats,
  RSVPAnalytics,
  EmailAnalytics,
  PhotoAnalytics,
  MessageAnalytics,
  AnalyticsApiResponse
} from '@/types/analytics'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Mail,
  Image,
  MessageCircle,
  TrendingUp,
  Calendar,
  MapPin,
  RefreshCw
} from 'lucide-react'

export default function AdminDashboard() {
  const router = useRouter()
  const { isMobile } = useMobileDetection()
  const [stats, setStats] = useState<DashboardStats>({
    totalGuests: 0,
    attending: 0,
    notAttending: 0,
    pending: 0,
    responseRate: 0,
    emailsSent: 0,
    emailOpenRate: 0,
    emailDeliveryRate: 0,
    photosUploaded: 0,
    photosApproved: 0,
    pendingPhotos: 0,
    newMessages: 0,
    urgentMessages: 0
  })

  // Calculate days until wedding (placeholder date)
  const weddingDate = new Date('2026-07-15')
  const today = new Date()
  const daysUntilWedding = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all analytics in parallel
      const [rsvpResponse, emailResponse, photoResponse, messageResponse] = await Promise.all([
        fetch('/api/admin/rsvp-analytics'),
        fetch('/api/admin/email-analytics'),
        fetch('/api/admin/photos/analytics'),
        fetch('/api/admin/messages/analytics')
      ])

      // Parse responses
      const rsvpResult: AnalyticsApiResponse<RSVPAnalytics> = await rsvpResponse.json()
      const emailResult: AnalyticsApiResponse<EmailAnalytics> = await emailResponse.json()
      const photoResult: AnalyticsApiResponse<PhotoAnalytics> = await photoResponse.json()
      const messageResult: AnalyticsApiResponse<MessageAnalytics> = await messageResponse.json()

      // Check for errors
      if (!rsvpResult.success || !emailResult.success || !photoResult.success || !messageResult.success) {
        throw new Error('Failed to fetch one or more analytics endpoints')
      }

      const rsvpData = rsvpResult.analytics!
      const emailData = emailResult.analytics!
      const photoData = photoResult.analytics!
      const messageData = messageResult.analytics!

      // Calculate correct response rate (attending + not_attending) / total
      const responseRate = rsvpData.overview.total > 0
        ? ((rsvpData.overview.attending + rsvpData.overview.notAttending) / rsvpData.overview.total) * 100
        : 0

      setStats({
        totalGuests: rsvpData.overview.total,
        attending: rsvpData.overview.attending,
        notAttending: rsvpData.overview.notAttending,
        pending: rsvpData.overview.pending,
        responseRate: Math.round(responseRate * 100) / 100,
        emailsSent: emailData.overview.total_emails_sent,
        emailOpenRate: emailData.overview.open_rate,
        emailDeliveryRate: emailData.overview.delivery_rate,
        photosUploaded: photoData.overview.total_photos,
        photosApproved: photoData.overview.approved_photos,
        pendingPhotos: photoData.overview.pending_photos,
        newMessages: messageData.overview.new_messages,
        urgentMessages: messageData.overview.urgent_messages
      })

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard statistics')

      // Don't reset stats on error, keep previous values if available
      if (stats.totalGuests === 0) {
        // Only set fallback if no previous data
        setStats({
          totalGuests: 0,
          attending: 0,
          notAttending: 0,
          pending: 0,
          responseRate: 0,
          emailsSent: 0,
          emailOpenRate: 0,
          emailDeliveryRate: 0,
          photosUploaded: 0,
          photosApproved: 0,
          pendingPhotos: 0,
          newMessages: 0,
          urgentMessages: 0
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'primary',
    subtitle
  }: {
    title: string
    value: string | number
    icon: any
    color?: string
    subtitle?: string
  }) => (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-card-foreground">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const handleNavigate = (path: string) => {
    router.push(path)
  }

  const handleRefresh = () => {
    fetchDashboardStats()
  }

  if (loading && stats.totalGuests === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-8 bg-muted rounded w-16" />
                  </div>
                  <div className="w-12 h-12 bg-muted rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Mobile dashboard
  if (isMobile) {
    return (
      <MobileDashboard
        stats={{
          totalGuests: stats.totalGuests,
          rsvpResponses: stats.attending + stats.notAttending,
          pendingRsvps: stats.pending,
          attendingGuests: stats.attending,
          photosUploaded: stats.photosUploaded,
          pendingPhotos: stats.pendingPhotos,
          messagesReceived: stats.newMessages,
          daysUntilWedding
        }}
        onNavigate={handleNavigate}
      />
    )
  }

  // Desktop dashboard
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your wedding.
            {lastUpdated && (
              <span className="text-xs block mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Wedding Timeline
          </Button>
          <Button variant="wedding">
            <MapPin className="w-4 h-4 mr-2" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 text-sm">
              <strong>Error loading dashboard data:</strong> {error}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Guests"
          value={stats.totalGuests}
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Attending"
          value={stats.attending}
          icon={UserCheck}
          color="green"
          subtitle={`${stats.responseRate}% response rate`}
        />
        <StatCard
          title="Not Attending"
          value={stats.notAttending}
          icon={UserX}
          color="red"
        />
        <StatCard
          title="Pending RSVP"
          value={stats.pending}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Email Performance"
          value={`${stats.emailOpenRate}%`}
          icon={Mail}
          color="blue"
          subtitle={`${stats.emailsSent} emails sent • ${stats.emailDeliveryRate}% delivered`}
        />
        <StatCard
          title="Photo Gallery"
          value={stats.photosApproved}
          icon={Image}
          color="purple"
          subtitle={`${stats.pendingPhotos} pending • ${stats.photosUploaded} total`}
        />
        <StatCard
          title="Messages"
          value={stats.newMessages}
          icon={MessageCircle}
          color="orange"
          subtitle={stats.urgentMessages > 0 ? `${stats.urgentMessages} urgent` : "All up to date"}
        />
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="wedding-card p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Mail className="w-4 h-4 mr-2" />
              Send RSVP Reminder ({stats.pending} guests)
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Image className="w-4 h-4 mr-2" aria-label="Photo uploads icon" />
              Review Photo Uploads ({stats.pendingPhotos} pending)
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <MessageCircle className="w-4 h-4 mr-2" />
              Respond to Messages ({stats.newMessages} new)
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Add New Guests
            </Button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="wedding-card p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-neutral-600">Sarah Johnson RSVP'd "Yes"</span>
              <span className="text-neutral-400 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-neutral-600">5 new photos uploaded by guests</span>
              <span className="text-neutral-400 ml-auto">4 hours ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-orange-500 rounded-full" />
              <span className="text-neutral-600">New message from Mike Davis</span>
              <span className="text-neutral-400 ml-auto">6 hours ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-neutral-600">RSVP reminder sent to 25 guests</span>
              <span className="text-neutral-400 ml-auto">1 day ago</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-neutral-600">Lisa Brown RSVP'd "No"</span>
              <span className="text-neutral-400 ml-auto">2 days ago</span>
            </div>
          </div>
        </div>
      </div>

      {/* RSVP Progress Chart */}
      <div className="wedding-card p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">RSVP Progress</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Attending ({stats.attending})</span>
            <span className="font-medium">{Math.round((stats.attending / stats.totalGuests) * 100)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: `${(stats.attending / stats.totalGuests) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Not Attending ({stats.notAttending})</span>
            <span className="font-medium">{Math.round((stats.notAttending / stats.totalGuests) * 100)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full" 
              style={{ width: `${(stats.notAttending / stats.totalGuests) * 100}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Pending ({stats.pending})</span>
            <span className="font-medium">{Math.round((stats.pending / stats.totalGuests) * 100)}%</span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full" 
              style={{ width: `${(stats.pending / stats.totalGuests) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
