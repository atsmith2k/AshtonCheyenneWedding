'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AccessRequestForm } from '@/components/access-request-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Heart, Users, Calendar, MapPin } from 'lucide-react'
import { useMobileDetection } from '@/hooks/use-mobile-detection'

export default function RequestAccessPage() {
  const router = useRouter()
  const { isMobile } = useMobileDetection()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-screen bg-gradient-to-br from-primary-50 to-secondary-50" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.push('/landing')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-primary" />
              <span className="font-script text-xl text-primary">
                Ashton & Cheyenne
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-script text-primary">
              Join Our Celebration
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We'd love to have you celebrate our special day with us! 
              Please request access to our wedding website below.
            </p>
          </div>

          {/* Wedding Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Save the Date</h3>
                <p className="text-muted-foreground">July 15, 2026</p>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <MapPin className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Location</h3>
                <p className="text-muted-foreground">Beautiful Garden Venue</p>
              </CardContent>
            </Card>

            <Card className="bg-card/90 backdrop-blur-sm border-border/50">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Celebration</h3>
                <p className="text-muted-foreground">Family & Friends</p>
              </CardContent>
            </Card>
          </div>

          {/* Access Request Form */}
          <AccessRequestForm 
            onSuccess={() => {
              // Form handles success state internally
            }}
            className="bg-card/90 backdrop-blur-sm border-border/50"
          />

          {/* Information Section */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                What happens next?
              </h3>
              <div className="space-y-3 text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center mt-0.5">
                    1
                  </div>
                  <p>
                    We'll review your access request within 24-48 hours
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center mt-0.5">
                    2
                  </div>
                  <p>
                    If approved, you'll receive an email with your unique invitation code
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center mt-0.5">
                    3
                  </div>
                  <p>
                    Use your invitation code to access our wedding website and RSVP
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-semibold flex items-center justify-center mt-0.5">
                    4
                  </div>
                  <p>
                    Explore wedding details, share photos, and help us celebrate!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Questions?
              </h3>
              <p className="text-muted-foreground">
                If you have any questions about accessing our wedding website, 
                please don't hesitate to reach out to us directly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <span className="font-script text-lg text-primary">
                Ashton & Cheyenne
              </span>
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              July 15, 2026 • We can't wait to celebrate with you!
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
