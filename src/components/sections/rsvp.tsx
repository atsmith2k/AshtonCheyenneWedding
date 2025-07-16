'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/components/providers'
import { Check, X, Heart } from 'lucide-react'

export function RSVP() {
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

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit RSVP')
      }

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting RSVP:', error)
      // You could add error state here to show user-friendly error messages
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <section id="rsvp" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto" />
            <p className="mt-4 text-neutral-600">Loading RSVP form...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!user || !guest) {
    return (
      <section id="rsvp" className="wedding-section bg-background">
        <div className="wedding-container">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="wedding-heading">
              RSVP
            </h2>
            <p className="wedding-subheading">
              Please let us know if you can join us
            </p>
            <div className="wedding-divider" />
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="text-center bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-8">
                <Heart className="w-16 h-16 text-primary/60 mx-auto mb-6" />
                <CardTitle className="font-serif text-2xl text-card-foreground mb-4">
                  Please Sign In to RSVP
                </CardTitle>
                <p className="text-muted-foreground mb-8">
                  To RSVP for Ashton and Cheyenne's wedding, please enter your invitation code.
                </p>
                <Button variant="wedding" size="lg" asChild>
                  <a href="/invitation">Enter Invitation Code</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    )
  }

  if (submitted) {
    return (
      <section id="rsvp" className="wedding-section bg-background">
        <div className="wedding-container">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center animate-scale-in bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="font-serif text-2xl text-card-foreground mb-4">
                  Thank You for Your RSVP!
                </CardTitle>
                <p className="text-muted-foreground mb-6">
                  We've received your response and are so excited to celebrate with you!
                </p>
              <p className="text-sm text-neutral-500">
                You can update your RSVP anytime by returning to this page.
              </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="rsvp" className="wedding-section bg-background">
      <div className="wedding-container">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="wedding-heading">
            RSVP
          </h2>
          <p className="wedding-subheading">
            Please let us know if you can join us
          </p>
          <div className="wedding-divider" />
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="font-serif text-2xl text-card-foreground">
                Hello, {guest.first_name} {guest.last_name}!
              </CardTitle>
              <p className="text-muted-foreground">
                We're so excited to potentially celebrate with you. Please fill out the form below.
              </p>
            </CardHeader>
            <CardContent>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Attendance */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Will you be attending our wedding? *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleInputChange('attending', 'yes')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.attending === 'yes'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Check className="w-6 h-6 mx-auto mb-2" />
                    <span className="font-medium">Yes, I'll be there!</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('attending', 'no')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      formData.attending === 'no'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <X className="w-6 h-6 mx-auto mb-2" />
                    <span className="font-medium">Sorry, can't make it</span>
                  </button>
                </div>
              </div>

              {/* Meal Preference (only if attending) */}
              {formData.attending === 'yes' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="mealPreference" className="text-sm font-medium text-card-foreground">
                      Meal Preference *
                    </Label>
                    <Select
                      value={formData.mealPreference}
                      onValueChange={(value) => handleInputChange('mealPreference', value)}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Please select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chicken">Chicken</SelectItem>
                        <SelectItem value="beef">Beef</SelectItem>
                        <SelectItem value="fish">Fish</SelectItem>
                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                        <SelectItem value="vegan">Vegan</SelectItem>
                        <SelectItem value="kids_meal">Kids Meal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dietaryRestrictions" className="text-sm font-medium text-card-foreground">
                      Dietary Restrictions or Allergies
                    </Label>
                    <Textarea
                      id="dietaryRestrictions"
                      value={formData.dietaryRestrictions}
                      onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                      rows={3}
                      placeholder="Please let us know about any dietary restrictions or allergies..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Children Attendance
                    </label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="childrenAttending"
                        checked={formData.childrenAttending}
                        onChange={(e) => setFormData(prev => ({ ...prev, childrenAttending: e.target.checked }))}
                        className="w-4 h-4 text-primary-600 bg-neutral-100 border-neutral-300 rounded focus:ring-primary-500 focus:ring-2"
                      />
                      <label htmlFor="childrenAttending" className="text-sm text-neutral-700">
                        Children will be attending with me
                      </label>
                    </div>
                  </div>

                  {/* Plus One (if allowed) */}
                  {guest.plus_one_allowed && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="plusOneName" className="text-sm font-medium text-card-foreground">
                          Plus One Name
                        </Label>
                        <Input
                          id="plusOneName"
                          type="text"
                          value={formData.plusOneName}
                          onChange={(e) => handleInputChange('plusOneName', e.target.value)}
                          placeholder="Name of your guest"
                        />
                      </div>

                      {formData.plusOneName && (
                        <div className="space-y-2">
                          <Label htmlFor="plusOneMeal" className="text-sm font-medium text-card-foreground">
                            Plus One Meal Preference
                          </Label>
                          <Select
                            value={formData.plusOneMeal}
                            onValueChange={(value) => handleInputChange('plusOneMeal', value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Please select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="chicken">Chicken</SelectItem>
                              <SelectItem value="beef">Beef</SelectItem>
                              <SelectItem value="fish">Fish</SelectItem>
                              <SelectItem value="vegetarian">Vegetarian</SelectItem>
                              <SelectItem value="vegan">Vegan</SelectItem>
                              <SelectItem value="kids_meal">Kids Meal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Special Notes */}
              <div className="space-y-2">
                <Label htmlFor="specialNotes" className="text-sm font-medium text-card-foreground">
                  Special Notes for Wedding Party
                </Label>
                <Textarea
                  id="specialNotes"
                  value={formData.specialNotes}
                  onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                  rows={4}
                  placeholder="Any special notes, accessibility needs, song requests, or messages for Ashton & Cheyenne..."
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4">
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
                      Submitting RSVP...
                    </>
                  ) : (
                    'Submit RSVP'
                  )}
                </Button>
              </div>
            </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
