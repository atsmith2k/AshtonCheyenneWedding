'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers'
import { MessageCircle, Send, Heart } from 'lucide-react'

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
    <section id="contact" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-serif text-4xl md:text-5xl text-neutral-800 mb-4">
            Contact Us
          </h2>
          <p className="text-xl text-neutral-600 mb-6">
            Have questions? We'd love to hear from you!
          </p>
          <div className="w-24 h-1 bg-primary-500 mx-auto" />
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div className="animate-slide-up">
              <div className="wedding-card p-8">
                <MessageCircle className="w-12 h-12 text-primary-500 mb-6" />
                <h3 className="font-serif text-2xl text-neutral-800 mb-4">
                  Get in Touch
                </h3>
                <p className="text-neutral-600 mb-6">
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
                    <h4 className="font-medium text-neutral-800 mb-2">Response Time:</h4>
                    <p className="text-sm text-neutral-600">
                      We typically respond within 24-48 hours. For urgent matters, 
                      please mark your message as urgent.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {!user || !guest ? (
                <div className="wedding-card p-8 text-center">
                  <Heart className="w-16 h-16 text-primary-300 mx-auto mb-6" />
                  <h3 className="font-serif text-2xl text-neutral-800 mb-4">
                    Please Sign In
                  </h3>
                  <p className="text-neutral-600 mb-8">
                    To send us a message, please enter your invitation code first.
                  </p>
                  <Button variant="wedding" size="lg" asChild>
                    <a href="/invitation">Enter Invitation Code</a>
                  </Button>
                </div>
              ) : submitted ? (
                <div className="wedding-card p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-serif text-2xl text-neutral-800 mb-4">
                    Message Sent!
                  </h3>
                  <p className="text-neutral-600 mb-6">
                    Thank you for reaching out! We'll get back to you soon.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <div className="wedding-card p-8">
                  <h3 className="font-serif text-2xl text-neutral-800 mb-6">
                    Send us a Message
                  </h3>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">
                        Subject *
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        className="wedding-input"
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

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-3">
                        Message *
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        className="wedding-input"
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
                        className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="urgent" className="text-sm text-neutral-700">
                        This is urgent (we'll prioritize your message)
                      </label>
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
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 text-center animate-fade-in">
          <div className="wedding-card p-8 max-w-2xl mx-auto">
            <Heart className="w-8 h-8 text-primary-500 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-neutral-800 mb-4">
              Thank You
            </h3>
            <p className="text-neutral-600">
              We're so grateful to have you as part of our special day. 
              Your presence means the world to us, and we can't wait to celebrate together!
            </p>
            <div className="mt-6 text-sm text-neutral-500">
              With love,<br />
              <span className="font-script text-lg text-primary-600">Ashton & Cheyenne</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
