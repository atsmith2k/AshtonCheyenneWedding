'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  ChefHat,
  Heart,
  AlertTriangle,
  TrendingUp,
  Calendar
} from 'lucide-react'

interface RSVPAnalytics {
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

interface RSVPAnalyticsProps {
  className?: string
}

export function RSVPAnalytics({ className }: RSVPAnalyticsProps) {
  const [analytics, setAnalytics] = useState<RSVPAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/admin/rsvp-analytics')

      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }

      const data = await response.json()
      setAnalytics(data.analytics)
    } catch (error) {
      console.error('Error fetching RSVP analytics:', error)
      setError(error instanceof Error ? error.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Failed to load analytics data</p>
        <p className="text-sm text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  const getMealDisplayName = (meal: string) => {
    return meal.charAt(0).toUpperCase() + meal.slice(1).replace('_', ' ')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Response Rate</p>
                <p className="text-2xl font-bold text-foreground">{analytics.overview.responseRate}%</p>
                <Progress value={analytics.overview.responseRate} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Attending</p>
                <p className="text-2xl font-bold text-foreground">{analytics.overview.attending}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.overview.total > 0 ? 
                    Math.round((analytics.overview.attending / analytics.overview.total) * 100) : 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ChefHat className="w-8 h-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Meals</p>
                <p className="text-2xl font-bold text-foreground">{analytics.meals.totalMeals}</p>
                <p className="text-xs text-muted-foreground">Including plus ones</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="w-8 h-8 text-pink-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Plus Ones</p>
                <p className="text-2xl font-bold text-foreground">{analytics.plusOnes.confirmed}</p>
                <p className="text-xs text-muted-foreground">
                  {analytics.plusOnes.rate}% of allowed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meal Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5" />
              Meal Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.meals.breakdown)
                .sort(([,a], [,b]) => b - a)
                .map(([meal, count]) => (
                  <div key={meal} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{getMealDisplayName(meal)}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{count}</Badge>
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ 
                            width: `${(count / analytics.meals.totalMeals) * 100}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Dietary Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Dietary Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total with restrictions</span>
                <Badge variant="outline">
                  {analytics.dietaryRestrictions.total} ({analytics.dietaryRestrictions.rate}%)
                </Badge>
              </div>
              
              {analytics.dietaryRestrictions.topRestrictions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Most common:</p>
                  {analytics.dietaryRestrictions.topRestrictions.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="capitalize">{item.restriction}</span>
                      <Badge variant="secondary" className="text-xs">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Activity (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recent responses</span>
              <Badge variant="outline">{analytics.timeline.recentResponses}</Badge>
            </div>
            
            {Object.keys(analytics.timeline.dailyBreakdown).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Daily breakdown:</p>
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {Object.entries(analytics.timeline.dailyBreakdown)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .slice(0, 7)
                    .map(([date, count]) => (
                      <div key={date} className="text-center p-2 bg-muted rounded">
                        <div className="font-medium">{new Date(date).getDate()}</div>
                        <div className="text-muted-foreground">{count}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Completion Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Complete RSVPs</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{analytics.overview.completionRate}%</Badge>
                <Progress value={analytics.overview.completionRate} className="w-20" />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{analytics.overview.attending}</div>
                <div className="text-xs text-muted-foreground">Attending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">{analytics.overview.notAttending}</div>
                <div className="text-xs text-muted-foreground">Not Attending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">{analytics.overview.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
