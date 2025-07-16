'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/components/providers'
import { MessageCircle, Send, Heart, Check } from 'lucide-react'

export function Contact() {
  const { user, guest } = useAuth()
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    isUrgent: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guest || !formData.subject || !formData.message) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/messages/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: guest.id,
          subject: formData.subject,
          message: formData.message,
          isUrgent: formData.isUrgent
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit message')
      }

      setSubmitted(true)
      setFormData({ subject: '', message: '', isUrgent: false })
    } catch (error) {
      console.error('Error submitting message:', error)
      // You could add error state here to show user-friendly error messages
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <section id="contact" className="wedding-section bg-background">
      <div className="wedding-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="wedding-heading">
            Contact Us
          </h2>
          <p className="wedding-subheading">
            Have questions? We'd love to hear from you!
          </p>
          <div className="wedding-divider" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="animate-slide-up">
              <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                <CardContent className="p-8">
                  <MessageCircle className="w-12 h-12 text-primary mb-6" />
                  <CardTitle className="font-serif text-2xl text-card-foreground mb-4">
                    Get in Touch
                  </CardTitle>
                  <p className="text-muted-foreground mb-6">
                    Whether you have questions about the wedding details, need help with your RSVP,
                    or just want to share your excitement with us, we're here to help!
                  </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-neutral-800 mb-2">Common Questions:</h4>
                    <ul className="text-sm text-neutral-600 space-y-1">
                      <li>• Wedding venue and directions</li>
                      <li>• Accommodation recommendations</li>
                      <li>• Dress code and what to wear</li>
                      <li>• Gift registry information</li>
                      <li>• Special dietary requirements</li>
                      <li>• Plus-one policies</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-card-foreground mb-2">Response Time:</h4>
                    <p className="text-sm text-muted-foreground">
                      We typically respond within 24-48 hours. For urgent matters,
                      please mark your message as urgent.
                    </p>
                  </div>
                </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {!user || !guest ? (
                <Card className="text-center bg-card/80 backdrop-blur-sm border-border/50">
                  <CardContent className="p-8">
                    <Heart className="w-16 h-16 text-primary/60 mx-auto mb-6" />
                    <CardTitle className="font-serif text-2xl text-card-foreground mb-4">
                      Please Sign In
                    </CardTitle>
                    <p className="text-muted-foreground mb-8">
                      To send us a message, please enter your invitation code first.
                    </p>
                    <Button variant="wedding" size="lg" asChild>
                      <a href="/invitation">Enter Invitation Code</a>
                    </Button>
                  </CardContent>
                </Card>
              ) : submitted ? (
                <Card className="text-center bg-card/80 backdrop-blur-sm border-border/50">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <CardTitle className="font-serif text-2xl text-card-foreground mb-4">
                      Message Sent!
                    </CardTitle>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out! We'll get back to you soon.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                    >
                      Send Another Message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card/80 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle className="font-serif text-2xl text-card-foreground">
                      Send us a Message
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="text-sm font-medium text-card-foreground">
                          Subject *
                        </Label>
                        <select
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => handleInputChange('subject', e.target.value)}
                          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          required
                        >
                          <option value="">Please select a topic...</option>
                          <option value="rsvp">RSVP Questions</option>
                          <option value="venue">Venue & Directions</option>
                          <option value="accommodations">Accommodations</option>
                          <option value="dress_code">Dress Code</option>
                          <option value="dietary">Dietary Requirements</option>
                          <option value="plus_one">Plus-One Questions</option>
                          <option value="registry">Gift Registry</option>
                          <option value="general">General Question</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-medium text-card-foreground">
                          Message *
                        </Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => handleInputChange('message', e.target.value)}
                          rows={6}
                          placeholder="Please share your question or message..."
                          required
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="urgent"
                          checked={formData.isUrgent}
                          onChange={(e) => handleInputChange('isUrgent', e.target.checked)}
                          className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                        />
                        <Label htmlFor="urgent" className="text-sm text-card-foreground">
                          This is urgent (we'll prioritize your message)
                        </Label>
                      </div>

                      <Button
                        type="submit"
                        variant="wedding"
                        size="lg"
                        className="w-full"
                        disabled={!formData.subject || !formData.message || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Sending Message...
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
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center animate-fade-in">
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-8">
              <Heart className="w-8 h-8 text-primary mx-auto mb-4" />
              <CardTitle className="font-serif text-xl text-card-foreground mb-4">
                Thank You
              </CardTitle>
              <p className="text-muted-foreground">
                We're so grateful to have you as part of our special day.
                Your presence means the world to us, and we can't wait to celebrate together!
              </p>
              <div className="mt-6 text-sm text-muted-foreground">
                With love,<br />
                <span className="font-script text-lg text-primary">Ashton & Cheyenne</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
