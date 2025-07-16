'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, MessageCircle, Heart, Phone, Mail, MapPin } from 'lucide-react'
import WeddingNavigation from '@/components/wedding-navigation'

export default function ContactPage() {
  const router = useRouter()
  const { user, guest, isLoading } = useAuth()
  const [messageData, setMessageData] = useState({
    subject: '',
    category: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!isLoading && (!user || !guest)) {
      router.push('/landing')
    }
  }, [user, guest, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guest || !messageData.message.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/messages/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: guest.id,
          subject: messageData.subject || 'General Question',
          category: messageData.category || 'general',
          message: messageData.message.trim()
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitted(true)
        setMessageData({ subject: '', category: '', message: '' })
      } else {
        console.error('Message submission failed:', result.error)
        alert('Failed to send message. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting message:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        title="Contact Us"
      />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-script text-5xl md:text-6xl text-primary mb-4">
            Contact Us
          </h1>
          <div className="flex items-center justify-center gap-4 text-primary/70 mb-6">
            <div className="h-px bg-primary/30 w-16" />
            <Heart className="w-6 h-6 fill-current text-primary" />
            <div className="h-px bg-primary/30 w-16" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Have questions about our wedding? We'd love to hear from you!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            {submitted ? (
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif text-primary mb-4">
                    Message Sent!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Thank you for reaching out! We'll get back to you as soon as possible.
                  </p>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Send Us a Message
                  </CardTitle>
                  <p className="text-muted-foreground">
                    We're here to help with any questions about our special day
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="category">Message Category</Label>
                      <Select value={messageData.category} onValueChange={(value) => 
                        setMessageData(prev => ({ ...prev, category: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="What is this about?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Question</SelectItem>
                          <SelectItem value="venue">Venue & Location</SelectItem>
                          <SelectItem value="accommodation">Accommodations</SelectItem>
                          <SelectItem value="transportation">Transportation</SelectItem>
                          <SelectItem value="dietary">Dietary Requirements</SelectItem>
                          <SelectItem value="gifts">Gifts & Registry</SelectItem>
                          <SelectItem value="schedule">Schedule & Timeline</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={messageData.subject}
                        onChange={(e) => setMessageData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief subject line for your message"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message *</Label>
                      <Textarea
                        id="message"
                        value={messageData.message}
                        onChange={(e) => setMessageData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Tell us what's on your mind..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="wedding"
                      size="lg"
                      className="w-full"
                      disabled={!messageData.message.trim() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Direct Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <p className="text-muted-foreground">
                  Prefer to reach out directly? Here are our contact details
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a href="mailto:wedding@ashtonandcheyenne.com" className="text-primary hover:underline">
                      wedding@ashtonandcheyenne.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <a href="tel:+1234567890" className="text-primary hover:underline">
                      (123) 456-7890
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-1">What should I wear?</h4>
                  <p className="text-sm text-muted-foreground">
                    We'll share dress code information once our venue is confirmed. 
                    Generally, cocktail attire is appropriate for most wedding celebrations.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Can I bring a plus one?</h4>
                  <p className="text-sm text-muted-foreground">
                    Plus one information is included in your invitation. If you're unsure, 
                    please check your RSVP form or contact us directly.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Will there be parking available?</h4>
                  <p className="text-sm text-muted-foreground">
                    We'll provide detailed parking and transportation information 
                    once our venue is finalized.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Are children welcome?</h4>
                  <p className="text-sm text-muted-foreground">
                    We love children! Please let us know in your RSVP if you'll be 
                    bringing little ones so we can plan accordingly.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Wedding Party */}
            <Card>
              <CardHeader>
                <CardTitle>Wedding Party Contacts</CardTitle>
                <p className="text-muted-foreground">
                  You can also reach out to our wedding party for assistance
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">Maid of Honor</p>
                  <p className="text-sm text-muted-foreground">Contact information coming soon</p>
                </div>
                <div>
                  <p className="font-medium">Best Man</p>
                  <p className="text-sm text-muted-foreground">Contact information coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
