'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, Users, Gift, Plane, Heart } from 'lucide-react'
import WeddingNavigation from '@/components/wedding-navigation'

interface WeddingInfoSection {
  id: string
  section: string
  title: string
  content: string
  order_index: number
}

export default function WeddingDetailsPage() {
  const router = useRouter()
  const { user, guest, isLoading } = useAuth()
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfoSection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!isLoading && (!user || !guest)) {
      router.push('/landing')
    }
  }, [user, guest, isLoading, router])

  useEffect(() => {
    const fetchWeddingInfo = async () => {
      try {
        const response = await fetch('/api/wedding-info')
        const result = await response.json()

        if (response.ok && result.success) {
          setWeddingInfo(result.data)
        } else {
          console.error('Failed to fetch wedding info:', result.error)
          // Fallback to placeholder data
          setWeddingInfo([
            {
              id: '1',
              section: 'ceremony',
              title: 'Ceremony Details',
              content: 'Join us for our wedding ceremony as we exchange vows and begin our journey as husband and wife.',
              order_index: 1
            },
            {
              id: '2',
              section: 'reception',
              title: 'Reception Celebration',
              content: 'After the ceremony, we invite you to celebrate with us at our reception with dinner, dancing, and joy.',
              order_index: 2
            },
            {
              id: '3',
              section: 'timeline',
              title: 'Wedding Day Timeline',
              content: 'Here\'s what to expect on our special day. More details will be shared soon!',
              order_index: 3
            }
          ])
        }
      } catch (error) {
        console.error('Error fetching wedding info:', error)
        // Fallback to placeholder data
        setWeddingInfo([
          {
            id: '1',
            section: 'welcome',
            title: 'Welcome to Our Wedding',
            content: 'We\'re so excited to celebrate our special day with you.',
            order_index: 1
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    if (user && guest) {
      fetchWeddingInfo()
    }
  }, [user, guest])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user || !guest) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <WeddingNavigation
        showBackButton={true}
        backUrl="/wedding"
        title="Wedding Details"
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-script text-5xl md:text-6xl text-primary mb-4">
            Wedding Details
          </h1>
          <div className="flex items-center justify-center gap-4 text-primary/70 mb-6">
            <div className="h-px bg-primary/30 w-16" />
            <Heart className="w-6 h-6 fill-current text-primary" />
            <div className="h-px bg-primary/30 w-16" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about our special day
          </p>
        </div>

        {/* Quick Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="p-6">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Date</h3>
              <p className="text-muted-foreground">September 12, 2026</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Time</h3>
              <p className="text-muted-foreground">3:00 PM</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-6">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Venue</h3>
              <p className="text-muted-foreground">The Otisco Disco</p>
              <p className="text-sm text-muted-foreground/80">123 Cattail Rd, Otisco, IN</p>
            </CardContent>
          </Card>
        </div>

        {/* Wedding Information Sections */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground mt-4">Loading wedding details...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {weddingInfo
              .sort((a, b) => a.order_index - b.order_index)
              .map((info) => (
                <Card key={info.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-2xl font-serif text-primary">
                        {info.title}
                      </CardTitle>
                      <Badge variant="secondary" className="capitalize">
                        {info.section}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-neutral max-w-none">
                      <p className="text-muted-foreground leading-relaxed">
                        {info.content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}

        {/* Additional Information */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                Gift Registry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Your presence is the greatest gift, but if you'd like to honor us with a gift, 
                we've created a registry for your convenience.
              </p>
              <Button variant="outline" className="w-full">
                View Registry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-primary" />
                Travel & Accommodations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                We'll be sharing information about recommended hotels and travel arrangements 
                once our venue is confirmed.
              </p>
              <Button variant="outline" className="w-full">
                Travel Info
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-serif text-primary mb-4">
                Ready to Celebrate With Us?
              </h3>
              <p className="text-muted-foreground mb-6">
                We can't wait to share our special day with you. Please let us know if you can join us!
              </p>
              <Button variant="wedding" size="lg" onClick={() => router.push('/wedding/rsvp')}>
                Submit Your RSVP
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
