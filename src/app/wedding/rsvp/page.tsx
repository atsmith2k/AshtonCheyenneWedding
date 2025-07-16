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
import { Checkbox } from '@/components/ui/checkbox'
import { Check, X, Heart, Users } from 'lucide-react'
import WeddingNavigation from '@/components/wedding-navigation'

export default function RSVPPage() {
  const router = useRouter()
  const { user, guest, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    attending: '',
    mealPreference: '',
    dietaryRestrictions: '',
    childrenAttending: false,
    plusOneName: '',
    plusOneMeal: '',
    specialNotes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!isLoading && (!user || !guest)) {
      router.push('/landing')
    }
  }, [user, guest, isLoading, router])

  useEffect(() => {
    // Check if guest has already submitted RSVP
    if (guest?.rsvp_status && guest.rsvp_status !== 'pending') {
      setSubmitted(true)
      setFormData(prev => ({
        ...prev,
        attending: guest.rsvp_status === 'attending' ? 'yes' : 'no'
      }))
    }
  }, [guest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guest || !formData.attending) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/rsvp/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: guest.id,
          attending: formData.attending === 'yes' ? 'attending' : 'not_attending',
          mealPreference: formData.mealPreference || undefined,
          dietaryRestrictions: formData.dietaryRestrictions || undefined,
          childrenAttending: formData.childrenAttending,
          plusOneName: formData.plusOneName || undefined,
          plusOneMeal: formData.plusOneMeal || undefined,
          specialNotes: formData.specialNotes || undefined
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitted(true)
      } else {
        console.error('RSVP submission failed:', result.error)
        alert('Failed to submit RSVP. Please try again.')
      }
    } catch (error) {
      console.error('Error submitting RSVP:', error)
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
        title="RSVP"
      />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="font-script text-5xl md:text-6xl text-primary mb-4">
            RSVP
          </h1>
          <div className="flex items-center justify-center gap-4 text-primary/70 mb-6">
            <div className="h-px bg-primary/30 w-16" />
            <Heart className="w-6 h-6 fill-current text-primary" />
            <div className="h-px bg-primary/30 w-16" />
          </div>
          <p className="text-lg text-muted-foreground">
            Please let us know if you can celebrate with us on our special day
          </p>
        </div>

        {submitted ? (
          /* Thank You Message */
          <Card className="text-center">
            <CardContent className="p-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-serif text-primary mb-4">
                Thank You for Your Response!
              </h2>
              <p className="text-muted-foreground mb-6">
                {formData.attending === 'yes' 
                  ? "We're so excited to celebrate with you on our special day!"
                  : "We're sorry you can't make it, but we understand. Thank you for letting us know."
                }
              </p>
              <div className="space-y-4">
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Update Response
                </Button>
                <div>
                  <Button variant="wedding" onClick={() => router.push('/wedding')}>
                    Back to Wedding Site
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* RSVP Form */
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl font-serif text-primary">
                {guest.first_name} {guest.last_name}
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Please complete your RSVP below
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Attendance */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Will you be attending our wedding? *
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      type="button"
                      variant={formData.attending === 'yes' ? 'wedding' : 'outline'}
                      className="h-16 flex flex-col items-center justify-center"
                      onClick={() => setFormData(prev => ({ ...prev, attending: 'yes' }))}
                    >
                      <Check className="w-6 h-6 mb-1" />
                      Yes, I'll be there!
                    </Button>
                    <Button
                      type="button"
                      variant={formData.attending === 'no' ? 'destructive' : 'outline'}
                      className="h-16 flex flex-col items-center justify-center"
                      onClick={() => setFormData(prev => ({ ...prev, attending: 'no' }))}
                    >
                      <X className="w-6 h-6 mb-1" />
                      Sorry, can't make it
                    </Button>
                  </div>
                </div>

                {formData.attending === 'yes' && (
                  <>
                    {/* Meal Preference */}
                    <div className="space-y-2">
                      <Label htmlFor="meal">Meal Preference</Label>
                      <Select value={formData.mealPreference} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, mealPreference: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your meal preference" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chicken">Chicken</SelectItem>
                          <SelectItem value="beef">Beef</SelectItem>
                          <SelectItem value="fish">Fish</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Dietary Restrictions */}
                    <div className="space-y-2">
                      <Label htmlFor="dietary">Dietary Restrictions or Allergies</Label>
                      <Textarea
                        id="dietary"
                        value={formData.dietaryRestrictions}
                        onChange={(e) => setFormData(prev => ({ ...prev, dietaryRestrictions: e.target.value }))}
                        placeholder="Please let us know about any dietary restrictions or allergies..."
                        rows={3}
                      />
                    </div>

                    {/* Plus One */}
                    {guest.plus_one_allowed && (
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Plus One Information</Label>
                        <div className="space-y-2">
                          <Label htmlFor="plusOneName">Guest Name</Label>
                          <Input
                            id="plusOneName"
                            value={formData.plusOneName}
                            onChange={(e) => setFormData(prev => ({ ...prev, plusOneName: e.target.value }))}
                            placeholder="Full name of your guest"
                          />
                        </div>
                        {formData.plusOneName && (
                          <div className="space-y-2">
                            <Label htmlFor="plusOneMeal">Guest Meal Preference</Label>
                            <Select value={formData.plusOneMeal} onValueChange={(value) => 
                              setFormData(prev => ({ ...prev, plusOneMeal: value }))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder="Select meal preference for your guest" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="chicken">Chicken</SelectItem>
                                <SelectItem value="beef">Beef</SelectItem>
                                <SelectItem value="fish">Fish</SelectItem>
                                <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                <SelectItem value="vegan">Vegan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Special Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Special Notes or Messages</Label>
                  <Textarea
                    id="notes"
                    value={formData.specialNotes}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialNotes: e.target.value }))}
                    placeholder="Any special requests, messages, or questions for us..."
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="wedding"
                  size="lg"
                  className="w-full"
                  disabled={!formData.attending || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit RSVP'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
