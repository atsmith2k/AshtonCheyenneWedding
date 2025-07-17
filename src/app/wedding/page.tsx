'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, Calendar, MapPin, Users, Camera, MessageCircle } from 'lucide-react'
import WeddingNavigation from '@/components/wedding-navigation'

export default function WeddingHomePage() {
  const router = useRouter()
  const { user, guest, isLoading } = useAuth()

  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!isLoading && (!user || !guest)) {
      router.push('/landing')
    }
  }, [user, guest, isLoading, router])

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
      <WeddingNavigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="font-script text-5xl md:text-7xl text-primary mb-4">
            Welcome to Our Wedding
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're so excited to celebrate our special day with you, {guest.first_name}! 
            Explore all the details about our wedding and let us know if you can join us.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/wedding/details')}>
            <CardHeader className="text-center">
              <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Wedding Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                View ceremony and reception information, timeline, and venue details
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/wedding/rsvp')}>
            <CardHeader className="text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">RSVP</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Let us know if you can attend and share your meal preferences
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/wedding/photos')}>
            <CardHeader className="text-center">
              <Camera className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Photo Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                View and share photos from our engagement and wedding journey
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push('/wedding/contact')}>
            <CardHeader className="text-center">
              <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center">
                Send us a message or ask questions about the wedding
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Wedding Preview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="text-center mb-8">
            <h2 className="font-serif text-3xl text-primary mb-4">Our Special Day</h2>
            <div className="flex items-center justify-center gap-4 text-primary/70 mb-6">
              <div className="h-px bg-primary/30 w-16" />
              <Heart className="w-6 h-6 fill-current text-primary" />
              <div className="h-px bg-primary/30 w-16" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Save the Date</h3>
              <p className="text-muted-foreground">
                Join us on September 12, 2026 for our special day!
                Mark your calendars and get ready to celebrate with us.
              </p>
            </div>
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Location</h3>
              <p className="text-muted-foreground">
                The Otisco Disco - 123 Cattail Rd, Otisco, IN
                <br />
                We can't wait to celebrate with you at this amazing venue!
              </p>
            </div>
          </div>
        </div>

        {/* RSVP Status */}
        {guest.rsvp_status && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-primary mb-2">RSVP Status</h3>
            <p className="text-muted-foreground">
              {guest.rsvp_status === 'attending' 
                ? "Thank you for confirming your attendance! We can't wait to celebrate with you."
                : guest.rsvp_status === 'not_attending'
                ? "We're sorry you can't make it, but we understand. Thank you for letting us know."
                : "We haven't received your RSVP yet. Please let us know if you can join us!"
              }
            </p>
            {guest.rsvp_status !== 'attending' && guest.rsvp_status !== 'not_attending' && (
              <Button variant="wedding" className="mt-4" onClick={() => router.push('/wedding/rsvp')}>
                Submit RSVP
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
