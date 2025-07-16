'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers'
import { Check, X, Heart } from 'lucide-react'

export function RSVP() {
  const { user, guest, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    attending: '',
    mealPreference: '',
    dietaryRestrictions: '',
    plusOneName: '',
    plusOneMeal: '',
    notes: ''
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
          plusOneName: formData.plusOneName || undefined,
          plusOneMeal: formData.plusOneMeal || undefined,
          notes: formData.notes || undefined
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
      <section id="rsvp" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="font-serif text-4xl md:text-5xl text-neutral-800 mb-4">
              RSVP
            </h2>
            <p className="text-xl text-neutral-600 mb-6">
              Please let us know if you can join us
            </p>
            <div className="w-24 h-1 bg-primary-500 mx-auto" />
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="wedding-card p-8 text-center">
              <Heart className="w-16 h-16 text-primary-300 mx-auto mb-6" />
              <h3 className="font-serif text-2xl text-neutral-800 mb-4">
                Please Sign In to RSVP
              </h3>
              <p className="text-neutral-600 mb-8">
                To RSVP for Ashton and Cheyenne's wedding, please enter your invitation code.
              </p>
              <Button variant="wedding" size="lg" asChild>
                <a href="/invitation">Enter Invitation Code</a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (submitted) {
    return (
      <section id="rsvp" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="wedding-card p-8 text-center animate-scale-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-serif text-2xl text-neutral-800 mb-4">
                Thank You for Your RSVP!
              </h3>
              <p className="text-neutral-600 mb-6">
                We've received your response and are so excited to celebrate with you!
              </p>
              <p className="text-sm text-neutral-500">
                You can update your RSVP anytime by returning to this page.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="rsvp" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-serif text-4xl md:text-5xl text-neutral-800 mb-4">
            RSVP
          </h2>
          <p className="text-xl text-neutral-600 mb-6">
            Please let us know if you can join us
          </p>
          <div className="w-24 h-1 bg-primary-500 mx-auto" />
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="wedding-card p-8">
            <div className="mb-8">
              <h3 className="font-serif text-2xl text-neutral-800 mb-2">
                Hello, {guest.first_name} {guest.last_name}!
              </h3>
              <p className="text-neutral-600">
                We're so excited to potentially celebrate with you. Please fill out the form below.
              </p>
            </div>

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
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Meal Preference *
                    </label>
                    <select
                      value={formData.mealPreference}
                      onChange={(e) => handleInputChange('mealPreference', e.target.value)}
                      className="wedding-input"
                      required
                    >
                      <option value="">Please select...</option>
                      <option value="chicken">Chicken</option>
                      <option value="beef">Beef</option>
                      <option value="fish">Fish</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="kids_meal">Kids Meal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Dietary Restrictions or Allergies
                    </label>
                    <textarea
                      value={formData.dietaryRestrictions}
                      onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                      className="wedding-input"
                      rows={3}
                      placeholder="Please let us know about any dietary restrictions or allergies..."
                    />
                  </div>

                  {/* Plus One (if allowed) */}
                  {guest.plus_one_allowed && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-3">
                          Plus One Name
                        </label>
                        <input
                          type="text"
                          value={formData.plusOneName}
                          onChange={(e) => handleInputChange('plusOneName', e.target.value)}
                          className="wedding-input"
                          placeholder="Name of your guest"
                        />
                      </div>

                      {formData.plusOneName && (
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-3">
                            Plus One Meal Preference
                          </label>
                          <select
                            value={formData.plusOneMeal}
                            onChange={(e) => handleInputChange('plusOneMeal', e.target.value)}
                            className="wedding-input"
                          >
                            <option value="">Please select...</option>
                            <option value="chicken">Chicken</option>
                            <option value="beef">Beef</option>
                            <option value="fish">Fish</option>
                            <option value="vegetarian">Vegetarian</option>
                            <option value="vegan">Vegan</option>
                            <option value="kids_meal">Kids Meal</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-3">
                  Special Notes or Messages
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="wedding-input"
                  rows={4}
                  placeholder="Any special notes, song requests, or messages for the happy couple..."
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
          </div>
        </div>
      </div>
    </section>
  )
}
