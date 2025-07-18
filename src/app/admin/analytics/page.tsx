'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RSVPAnalytics } from '@/components/admin/rsvp-analytics'
import { EmailAnalytics } from '@/components/admin/email-analytics'
import { GuestAnalytics } from '@/components/admin/guest-analytics'
import {
  BarChart3,
  Users,
  Mail,
  Image as ImageIcon,
  MessageSquare,
  Download,
  RefreshCw,
  TrendingUp
} from 'lucide-react'

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [isExporting, setIsExporting] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      // TODO: Implement data export functionality
      console.log('Exporting analytics data...')
      // This would typically generate a CSV or PDF report
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your wedding planning progress
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleExportData}
            disabled={isExporting}
          >
            <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-pulse' : ''}`} />
            Export Report
          </Button>
          <Button variant="wedding">
            <TrendingUp className="w-4 h-4 mr-2" />
            View Insights
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="guests" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Guests & RSVPs
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Communications
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Media & Messages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This overview provides a high-level summary of all your wedding analytics.
                  Use the tabs above to dive deeper into specific areas.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">RSVP Response Rate</span>
                    <span className="font-medium">Loading...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email Open Rate</span>
                    <span className="font-medium">Loading...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Photo Approval Rate</span>
                    <span className="font-medium">Loading...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="guests" className="space-y-6">
          <RSVPAnalytics />
          <GuestAnalytics />
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <EmailAnalytics />
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Photo Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Photo analytics component will be displayed here.
                  This will show upload statistics, approval rates, and gallery performance.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Message Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Message analytics component will be displayed here.
                  This will show response rates, urgent messages, and communication trends.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
