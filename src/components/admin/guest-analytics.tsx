'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Utensils, 
  Heart,
  Phone,
  Mail,
  FileText,
  TrendingUp
} from 'lucide-react'

interface GuestStats {
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
  specialRequirements: {
    withNotes: number
    childrenAttending: number
  }
}

interface GuestAnalyticsProps {
  refreshTrigger?: number
}

export function GuestAnalytics({ refreshTrigger }: GuestAnalyticsProps) {
  const [stats, setStats] = useState<GuestStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [refreshTrigger])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/guests/stats')
      const result = await response.json()
      
      if (response.ok && result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching guest stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-16 bg-neutral-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-neutral-600">Failed to load guest statistics</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Guests</p>
                <p className="text-2xl font-bold text-neutral-800">{stats.totalGuests}</p>
              </div>
              <Users className="w-8 h-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Attending</p>
                <p className="text-2xl font-bold text-green-600">{stats.rsvp.attending}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Response Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.rsvp.responseRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Guest Groups</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalGroups}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RSVP Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              RSVP Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Attending</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {stats.rsvp.attending}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Not Attending</span>
                <Badge variant="default" className="bg-red-100 text-red-800">
                  {stats.rsvp.notAttending}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Pending</span>
                <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                  {stats.rsvp.pending}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Meal Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(stats.meals).map(([meal, count]) => (
                <div key={meal} className="flex justify-between items-center">
                  <span className="text-sm text-neutral-600 capitalize">
                    {meal === 'kidsMenu' ? 'Kids Menu' : meal === 'notSpecified' ? 'Not Specified' : meal}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Plus Ones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Allowed</span>
                <Badge variant="outline">{stats.plusOnes.allowed}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">With Names</span>
                <Badge variant="outline">{stats.plusOnes.withNames}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Not Allowed</span>
                <Badge variant="outline">{stats.plusOnes.notAllowed}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact & Special Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">With Email</span>
                <Badge variant="outline">{stats.contactInfo.withEmail}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">With Phone</span>
                <Badge variant="outline">{stats.contactInfo.withPhone}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Complete Contact</span>
                <Badge variant="outline">{stats.contactInfo.withBoth}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Special Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Dietary Restrictions</span>
                <Badge variant="outline">{stats.dietaryRestrictions.withRestrictions}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Special Notes</span>
                <Badge variant="outline">{stats.specialRequirements.withNotes}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">Children Attending</span>
                <Badge variant="outline">{stats.specialRequirements.childrenAttending}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent RSVPs */}
      {stats.timeline.recentRSVPs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent RSVPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.timeline.recentRSVPs.slice(0, 5).map((rsvp, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-neutral-50">
                  <span className="text-sm font-medium">{rsvp.guestName}</span>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={rsvp.rsvpStatus === 'attending' ? 'default' : 'outline'}
                      className={
                        rsvp.rsvpStatus === 'attending' 
                          ? 'bg-green-100 text-green-800' 
                          : rsvp.rsvpStatus === 'not_attending'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {rsvp.rsvpStatus === 'attending' ? 'Attending' : 
                       rsvp.rsvpStatus === 'not_attending' ? 'Not Attending' : 'Pending'}
                    </Badge>
                    <span className="text-xs text-neutral-500">
                      {new Date(rsvp.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
