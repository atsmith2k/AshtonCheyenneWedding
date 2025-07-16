'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  MapPin
} from 'lucide-react'

interface DashboardStats {
  totalGuests: number
  attending: number
  notAttending: number
  pending: number
  emailsSent: number
  emailOpenRate: number
  photosUploaded: number
  pendingPhotos: number
  newMessages: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalGuests: 0,
    attending: 0,
    notAttending: 0,
    pending: 0,
    emailsSent: 0,
    emailOpenRate: 0,
    photosUploaded: 0,
    pendingPhotos: 0,
    newMessages: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      // Fetch guests stats
      const guestsResponse = await fetch('/api/admin/guests')
      const guestsResult = await guestsResponse.json()

      // Fetch photos stats
      const photosResponse = await fetch('/api/photos/upload')
      const photosResult = await photosResponse.json()

      // Fetch messages stats
      const messagesResponse = await fetch('/api/messages/submit')
      const messagesResult = await messagesResponse.json()

      if (guestsResult.success && photosResult.success && messagesResult.success) {
        const guests = guestsResult.data
        const photos = photosResult.data
        const messages = messagesResult.data

        setStats({
          totalGuests: guests.length,
          attending: guests.filter((g: any) => g.rsvp_status === 'attending').length,
          notAttending: guests.filter((g: any) => g.rsvp_status === 'not_attending').length,
          pending: guests.filter((g: any) => g.rsvp_status === 'pending').length,
          emailsSent: 0, // Will be implemented with email tracking
          emailOpenRate: 0, // Will be implemented with email tracking
          photosUploaded: photos.length,
          pendingPhotos: photos.filter((p: any) => !p.approved).length,
          newMessages: messages.filter((m: any) => m.status === 'new').length
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Fallback to placeholder data
      setStats({
        totalGuests: 0,
        attending: 0,
        notAttending: 0,
        pending: 0,
        emailsSent: 0,
        emailOpenRate: 0,
        photosUploaded: 0,
        pendingPhotos: 0,
        newMessages: 0
      })
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

  if (loading) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your wedding.</p>
        </div>
        <div className="flex gap-3">
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
          subtitle={`${Math.round((stats.attending / stats.totalGuests) * 100)}% response rate`}
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
          subtitle={`${stats.emailsSent} emails sent`}
        />
        <StatCard
          title="Photo Uploads"
          value={stats.photosUploaded}
          icon={Image}
          color="purple"
          subtitle={`${stats.pendingPhotos} pending approval`}
        />
        <StatCard
          title="New Messages"
          value={stats.newMessages}
          icon={MessageCircle}
          color="orange"
          subtitle="Requires response"
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
              <Image className="w-4 h-4 mr-2" />
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
