'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Heart, Calendar, MapPin } from 'lucide-react'
import { useAuth } from '@/components/providers'

export function Hero() {
  const { user, guest, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="h-screen bg-gradient-to-br from-primary-50 to-secondary-50" />
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-secondary-50" />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-200 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary-200 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-100 rounded-full blur-2xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Names */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-script text-6xl md:text-8xl lg:text-9xl text-primary-600 mb-4">
            Ashton & Cheyenne
          </h1>
          <div className="flex items-center justify-center gap-4 text-secondary-600">
            <div className="h-px bg-secondary-300 w-16" />
            <Heart className="w-6 h-6 fill-current" />
            <div className="h-px bg-secondary-300 w-16" />
          </div>
        </div>

        {/* Tagline */}
        <div className="mb-12 animate-slide-up">
          <p className="font-serif text-xl md:text-2xl text-neutral-700 mb-2">
            Two Hearts, One Love Story
          </p>
          <p className="text-neutral-600 text-lg">
            Join us as we say "I Do" and begin our journey as husband and wife
          </p>
        </div>

        {/* Wedding Details */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="wedding-card p-8 max-w-2xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center justify-center gap-3">
                <Calendar className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="font-medium text-neutral-800">Wedding Date</p>
                  <p className="text-neutral-600">Coming Soon</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <MapPin className="w-5 h-5 text-primary-500" />
                <div>
                  <p className="font-medium text-neutral-800">Location</p>
                  <p className="text-neutral-600">To Be Announced</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {isLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : user && guest ? (
            <div className="space-y-4">
              <p className="text-lg text-neutral-700 mb-6">
                Welcome back, {guest.first_name}!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="wedding" size="xl" asChild>
                  <a href="#rsvp">Update RSVP</a>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <a href="#info">Wedding Details</a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-lg text-neutral-700 mb-6">
                We can't wait to celebrate with you!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="wedding" size="xl" asChild>
                  <a href="/invitation">Enter Invitation Code</a>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <a href="#info">Learn More</a>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-neutral-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-neutral-400 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
