'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin, Clock, Users, Gift, Plane } from 'lucide-react'

interface WeddingInfoSection {
  id: string
  section: string
  title: string
  content: string
  order_index: number
}

export function WeddingInfo() {
  const [weddingInfo, setWeddingInfo] = useState<WeddingInfoSection[]>([])
  const [loading, setLoading] = useState(true)

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
              section: 'welcome',
              title: 'Welcome to Ashton & Cheyenne\'s Wedding',
              content: 'Welcome to our wedding website! We\'re so excited to celebrate our special day with you.',
              order_index: 1
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
            title: 'Welcome to Ashton & Cheyenne\'s Wedding',
            content: 'Welcome to our wedding website! We\'re so excited to celebrate our special day with you.',
            order_index: 1
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchWeddingInfo()
  }, [])

  const getIcon = (section: string) => {
    switch (section) {
      case 'ceremony':
        return <Users className="w-6 h-6" />
      case 'reception':
        return <Calendar className="w-6 h-6" />
      case 'accommodations':
        return <MapPin className="w-6 h-6" />
      case 'travel':
        return <Plane className="w-6 h-6" />
      case 'registry':
        return <Gift className="w-6 h-6" />
      default:
        return <Clock className="w-6 h-6" />
    }
  }

  if (loading) {
    return (
      <section id="info" className="wedding-section bg-muted/30">
        <div className="wedding-container">
          <div className="text-center mb-16">
            <h2 className="wedding-heading">
              Wedding Information
            </h2>
            <div className="wedding-divider" />
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse bg-card/80 backdrop-blur-sm border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-full" />
                    <div className="h-6 bg-muted rounded w-32" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="info" className="wedding-section bg-muted/30">
      <div className="wedding-container">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="wedding-heading">
            Wedding Information
          </h2>
          <p className="wedding-subheading">
            Everything you need to know about our special day
          </p>
          <div className="wedding-divider" />
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {weddingInfo.map((info, index) => (
            <Card
              key={info.id}
              className="hover:shadow-xl transition-all duration-300 animate-slide-up bg-card/80 backdrop-blur-sm border-border/50"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    {getIcon(info.section)}
                  </div>
                  <CardTitle className="font-serif text-2xl text-card-foreground">
                    {info.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div
                  className="text-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: info.content }}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center animate-fade-in">
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8">
              <CardTitle className="font-serif text-2xl text-card-foreground mb-4">
                Questions?
              </CardTitle>
              <p className="text-muted-foreground mb-6">
                If you have any questions about the wedding or need additional information,
                please don't hesitate to reach out to us.
              </p>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
              >
                Contact Us
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
