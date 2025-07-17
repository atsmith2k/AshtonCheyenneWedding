'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Mail,
  Send,
  Eye,
  MousePointer,
  AlertTriangle,
  BarChart3
} from 'lucide-react'

interface EmailAnalytics {
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
  campaign_performance: Array<{
    id: string
    name: string
    status: string
    sent_count: number
    delivered_count: number
    opened_count: number
    clicked_count: number
    bounced_count: number
    delivery_rate: number
    open_rate: number
    click_rate: number
    bounce_rate: number
    sent_at?: string
    completed_at?: string
  }>
  template_stats: Array<{
    id: string
    template_type: string
    subject: string
    campaigns_count: number
    total_sent: number
    total_delivered: number
    total_opened: number
    total_clicked: number
    open_rate: number
    click_rate: number
  }>
}

interface EmailAnalyticsProps {
  className?: string
}

export function EmailAnalytics({ className }: EmailAnalyticsProps) {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/email-analytics')
      const result = await response.json()

      if (response.ok && result.success) {
        setAnalytics(result.analytics)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-neutral-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <BarChart3 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-neutral-800 mb-2">
          No Analytics Data
        </h3>
        <p className="text-neutral-600">
          Send some email campaigns to see analytics data here.
        </p>
      </div>
    )
  }

  const { overview, campaign_performance, template_stats } = analytics

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Sent</p>
                <p className="text-2xl font-bold text-blue-600">{overview.total_emails_sent}</p>
              </div>
              <Send className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Delivery Rate</p>
                <p className="text-2xl font-bold text-green-600">{overview.delivery_rate}%</p>
              </div>
              <Mail className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Open Rate</p>
                <p className="text-2xl font-bold text-purple-600">{overview.open_rate}%</p>
              </div>
              <Eye className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Click Rate</p>
                <p className="text-2xl font-bold text-orange-600">{overview.click_rate}%</p>
              </div>
              <MousePointer className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      {campaign_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>
              Performance metrics for your email campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaign_performance.slice(0, 5).map((campaign) => (
                <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-800">{campaign.name}</h4>
                    <p className="text-sm text-neutral-600 capitalize">{campaign.status}</p>
                    {campaign.sent_at && (
                      <p className="text-xs text-neutral-500">
                        Sent {new Date(campaign.sent_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Sent</p>
                      <p className="text-lg font-bold">{campaign.sent_count}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Delivered</p>
                      <p className="text-lg font-bold text-green-600">{campaign.delivery_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Opened</p>
                      <p className="text-lg font-bold text-purple-600">{campaign.open_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Clicked</p>
                      <p className="text-lg font-bold text-orange-600">{campaign.click_rate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Performance */}
      {template_stats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Template Performance</CardTitle>
            <CardDescription>
              How your email templates are performing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {template_stats.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-800">{template.subject}</h4>
                    <p className="text-sm text-neutral-600 capitalize">
                      {template.template_type.replace('_', ' ')} • {template.campaigns_count} campaigns
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Sent</p>
                      <p className="text-lg font-bold">{template.total_sent}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Open Rate</p>
                      <p className="text-lg font-bold text-purple-600">{template.open_rate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Click Rate</p>
                      <p className="text-lg font-bold text-orange-600">{template.click_rate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Campaigns</span>
                <span className="font-medium">{overview.total_campaigns}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Delivered</span>
                <span className="font-medium">{overview.total_delivered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Opened</span>
                <span className="font-medium">{overview.total_opened}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Total Clicked</span>
                <span className="font-medium">{overview.total_clicked}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Bounce Rate</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{overview.bounce_rate}%</span>
                  {overview.bounce_rate > 5 && (
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <div className="text-sm text-neutral-500">
                {overview.bounce_rate <= 2 && "Excellent delivery health"}
                {overview.bounce_rate > 2 && overview.bounce_rate <= 5 && "Good delivery health"}
                {overview.bounce_rate > 5 && "Consider reviewing your email list quality"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
