'use client'

import { useState, useEffect } from 'react'
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
      <section id="info" className="py-20 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-neutral-800 mb-4">
              Wedding Information
            </h2>
            <div className="w-24 h-1 bg-primary-500 mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="wedding-card p-8 animate-pulse">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-neutral-200 rounded-full" />
                  <div className="h-6 bg-neutral-200 rounded w-32" />
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-neutral-200 rounded w-full" />
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-4 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="info" className="py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-serif text-4xl md:text-5xl text-neutral-800 mb-4">
            Wedding Information
          </h2>
          <p className="text-xl text-neutral-600 mb-6">
            Everything you need to know about our special day
          </p>
          <div className="w-24 h-1 bg-primary-500 mx-auto" />
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {weddingInfo.map((info, index) => (
            <div 
              key={info.id} 
              className="wedding-card p-8 hover:shadow-xl transition-shadow duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
                  {getIcon(info.section)}
                </div>
                <h3 className="font-serif text-2xl text-neutral-800">
                  {info.title}
                </h3>
              </div>
              <div 
                className="text-neutral-600 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: info.content }}
              />
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center animate-fade-in">
          <div className="wedding-card p-8 max-w-2xl mx-auto">
            <h3 className="font-serif text-2xl text-neutral-800 mb-4">
              Questions?
            </h3>
            <p className="text-neutral-600 mb-6">
              If you have any questions about the wedding or need additional information, 
              please don't hesitate to reach out to us.
            </p>
            <a 
              href="#contact" 
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Contact Us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
