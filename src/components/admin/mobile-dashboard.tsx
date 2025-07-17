'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { 
  Users, 
  Calendar, 
  Camera, 
  Mail, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Heart,
  MessageSquare,
  Image as ImageIcon,
  UserCheck
} from 'lucide-react'

interface DashboardStats {
  totalGuests: number
  rsvpResponses: number
  pendingRsvps: number
  attendingGuests: number
  photosUploaded: number
  pendingPhotos: number
  messagesReceived: number
  daysUntilWedding: number
}

interface MobileDashboardProps {
  stats: DashboardStats
  onNavigate: (path: string) => void
}

export function MobileDashboard({ stats, onNavigate }: MobileDashboardProps) {
  const { isMobile, isTouchDevice } = useMobileDetection()
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  const quickActions = [
    {
      title: 'Manage Guests',
      description: 'Add, edit, or view guest information',
      icon: Users,
      path: '/admin/guests',
      color: 'bg-blue-500',
      count: stats.totalGuests
    },
    {
      title: 'Review RSVPs',
      description: 'Check latest RSVP responses',
      icon: UserCheck,
      path: '/admin/guests/rsvp',
      color: 'bg-green-500',
      count: stats.rsvpResponses
    },
    {
      title: 'Approve Photos',
      description: 'Review and approve guest photos',
      icon: Camera,
      path: '/admin/media',
      color: 'bg-purple-500',
      count: stats.pendingPhotos
    },
    {
      title: 'Messages',
      description: 'Read guest messages and communications',
      icon: MessageSquare,
      path: '/admin/communications',
      color: 'bg-orange-500',
      count: stats.messagesReceived
    }
  ]

  const statsCards = [
    {
      title: 'Total Guests',
      value: stats.totalGuests,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Attending',
      value: stats.attendingGuests,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Pending RSVPs',
      value: stats.pendingRsvps,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Photos Shared',
      value: stats.photosUploaded,
      icon: ImageIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ]

  if (!isMobile) return null

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-2xl font-script text-primary">
            Wedding Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground">
          {greeting}! Here's your wedding overview.
        </p>
        
        {/* Countdown */}
        <div className="mt-4 p-4 bg-primary/5 rounded-lg">
          <div className="text-3xl font-bold text-primary">
            {stats.daysUntilWedding}
          </div>
          <div className="text-sm text-muted-foreground">
            days until your special day
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {statsCards.map((stat, index) => (
          <Card key={index} className="text-center">
            <CardContent className="p-4">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${stat.bgColor} mb-3`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.title}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        {quickActions.map((action, index) => (
          <Card 
            key={index} 
            className="cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => onNavigate(action.path)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${action.color} text-white`}>
                  <action.icon className="w-6 h-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground">
                      {action.title}
                    </h3>
                    {action.count > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {action.count}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.pendingRsvps > 0 && (
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  {stats.pendingRsvps} pending RSVP{stats.pendingRsvps !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-yellow-600">
                  Follow up with guests who haven't responded
                </p>
              </div>
            </div>
          )}
          
          {stats.pendingPhotos > 0 && (
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Camera className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-800">
                  {stats.pendingPhotos} photo{stats.pendingPhotos !== 1 ? 's' : ''} awaiting approval
                </p>
                <p className="text-xs text-purple-600">
                  Review and approve guest uploads
                </p>
              </div>
            </div>
          )}
          
          {stats.messagesReceived > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">
                  {stats.messagesReceived} new message{stats.messagesReceived !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-600">
                  Read messages from your guests
                </p>
              </div>
            </div>
          )}
          
          {stats.pendingRsvps === 0 && stats.pendingPhotos === 0 && stats.messagesReceived === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-sm">All caught up! 🎉</p>
              <p className="text-xs">No pending actions at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wedding Day Preparation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Wedding Day Prep
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className={`w-full justify-start ${isTouchDevice ? 'min-h-[48px]' : ''}`}
            onClick={() => onNavigate('/admin/analytics')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            View Analytics & Reports
          </Button>
          
          <Button 
            variant="outline" 
            className={`w-full justify-start ${isTouchDevice ? 'min-h-[48px]' : ''}`}
            onClick={() => onNavigate('/admin/settings')}
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Wedding Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
