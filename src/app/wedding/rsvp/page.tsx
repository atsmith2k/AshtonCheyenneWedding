'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SelectItem } from '@/components/ui/select'
import { MobileInput, MobileTextarea, MobileSelect, MobileRadioGroup, MobileCheckbox } from '@/components/mobile/mobile-form-controls'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { Check, X, Heart, Users } from 'lucide-react'
import WeddingNavigation from '@/components/wedding-navigation'

interface GuestRSVPData {
  id: string
  firstName: string
  lastName: string
  email?: string
  invitationCode: string
  rsvpStatus: 'pending' | 'attending' | 'not_attending'
  mealPreference?: string
  dietaryRestrictions?: string
  plusOneAllowed: boolean
  plusOneName?: string
  plusOneMeal?: string
  specialNotes?: string
  rsvpSubmittedAt?: string
}

export default function RSVPPage() {
  const router = useRouter()
  const { user, guest, isLoading, refreshGuestData } = useAuth()
  const { isMobile, isTouchDevice } = useMobileDetection()
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
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    // If user is not authenticated, redirect to landing page
    if (!isLoading && (!user || !guest)) {
      router.push('/landing')
    }
  }, [user, guest, isLoading, router])

  // Function to populate form with guest RSVP data
  const populateFormWithGuestData = (guestData: any) => {
    if (!guestData) return

    setFormData({
      attending: guestData.rsvpStatus === 'attending' ? 'yes' : guestData.rsvpStatus === 'not_attending' ? 'no' : '',
      mealPreference: guestData.mealPreference || '',
      dietaryRestrictions: guestData.dietaryRestrictions || '',
      childrenAttending: false, // This field isn't stored in the database currently
      plusOneName: guestData.plusOneName || '',
      plusOneMeal: guestData.plusOneMeal || '',
      specialNotes: guestData.specialNotes || ''
    })

    // Set submitted state if RSVP has been submitted
    if (guestData.rsvpStatus && guestData.rsvpStatus !== 'pending') {
      setSubmitted(true)
    } else {
      setSubmitted(false)
    }
  }

  // Function to fetch current guest data
  const fetchCurrentGuestData = async () => {
    if (!guest?.id && !guest?.invitationCode) return

    setIsLoadingData(true)
    try {
      const response = await fetch('/api/guest/current', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': guest?.id || '',
          'x-invitation-code': guest?.invitationCode || ''
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.guest) {
          populateFormWithGuestData(result.guest)
          // Also refresh the guest data in auth context
          await refreshGuestData()
        }
      } else {
        console.error('Failed to fetch guest data:', response.status, response.statusText)
        // Fallback to using existing guest data if API call fails
        if (guest) {
          populateFormWithGuestData(guest)
        }
      }
    } catch (error) {
      console.error('Error fetching current guest data:', error)
      // Fallback to using existing guest data if API call fails
      if (guest) {
        populateFormWithGuestData(guest)
      }
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    // Populate form with existing guest data when component mounts
    if (guest) {
      populateFormWithGuestData(guest)
      // Also fetch fresh data from server to ensure it's up to date
      fetchCurrentGuestData()
    }
  }, [guest?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.attending) {
      newErrors.attending = 'Please let us know if you will be attending'
    }

    if (formData.attending === 'yes' && !formData.mealPreference) {
      newErrors.mealPreference = 'Please select your meal preference'
    }

    if (guest?.plus_one_allowed && formData.attending === 'yes' && formData.plusOneName && !formData.plusOneMeal) {
      newErrors.plusOneMeal = 'Please select meal preference for your plus one'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guest || !validateForm()) return

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
        // Refresh guest data to get the latest RSVP information
        await refreshGuestData()
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
                <Button
                  variant="outline"
                  onClick={async () => {
                    setSubmitted(false)
                    // Fetch fresh data when updating response
                    await fetchCurrentGuestData()
                  }}
                  disabled={isLoadingData}
                >
                  {isLoadingData ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Update Response'
                  )}
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
                {isLoadingData ? 'Loading your RSVP information...' : 'Please complete your RSVP below'}
              </p>
              {isLoadingData && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Attendance */}
                <MobileRadioGroup
                  label="Will you be attending our wedding?"
                  required
                  value={formData.attending}
                  onValueChange={(value) => handleInputChange('attending', value)}
                  error={errors.attending}
                  options={[
                    {
                      value: 'yes',
                      label: "Yes, I'll be there!",
                      description: "We can't wait to celebrate with you"
                    },
                    {
                      value: 'no',
                      label: "Sorry, can't make it",
                      description: "We'll miss you but understand"
                    }
                  ]}
                />

                {formData.attending === 'yes' && (
                  <>
                    {/* Meal Preference */}
                    <MobileSelect
                      label="Meal Preference"
                      required
                      placeholder="Select your meal preference"
                      value={formData.mealPreference}
                      onValueChange={(value) => handleInputChange('mealPreference', value)}
                      error={errors.mealPreference}
                    >
                      <SelectItem value="chicken">Herb-Roasted Chicken</SelectItem>
                      <SelectItem value="beef">Grilled Beef Tenderloin</SelectItem>
                      <SelectItem value="fish">Pan-Seared Salmon</SelectItem>
                      <SelectItem value="vegetarian">Vegetarian Pasta Primavera</SelectItem>
                      <SelectItem value="vegan">Vegan Mediterranean Bowl</SelectItem>
                    </MobileSelect>

                    {/* Dietary Restrictions */}
                    <MobileTextarea
                      label="Dietary Restrictions or Allergies"
                      placeholder="Please let us know about any dietary restrictions or allergies..."
                      value={formData.dietaryRestrictions}
                      onChange={(e) => handleInputChange('dietaryRestrictions', e.target.value)}
                      helperText="This helps our caterers prepare the perfect meal for you"
                    />

                    {/* Plus One */}
                    {guest.plus_one_allowed && (
                      <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                        <h3 className="text-base font-medium text-foreground">Plus One Information</h3>

                        <MobileInput
                          label="Guest Name"
                          placeholder="Full name of your guest"
                          value={formData.plusOneName}
                          onChange={(e) => handleInputChange('plusOneName', e.target.value)}
                          helperText="Let us know who will be joining you"
                        />

                        {formData.plusOneName && (
                          <MobileSelect
                            label="Guest Meal Preference"
                            placeholder="Select meal preference for your guest"
                            value={formData.plusOneMeal}
                            onValueChange={(value) => handleInputChange('plusOneMeal', value)}
                            error={errors.plusOneMeal}
                          >
                            <SelectItem value="chicken">Herb-Roasted Chicken</SelectItem>
                            <SelectItem value="beef">Grilled Beef Tenderloin</SelectItem>
                            <SelectItem value="fish">Pan-Seared Salmon</SelectItem>
                            <SelectItem value="vegetarian">Vegetarian Pasta Primavera</SelectItem>
                            <SelectItem value="vegan">Vegan Mediterranean Bowl</SelectItem>
                          </MobileSelect>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Special Notes */}
                <MobileTextarea
                  label="Special Notes or Messages"
                  placeholder="Any special requests, messages, or questions for us..."
                  value={formData.specialNotes}
                  onChange={(e) => handleInputChange('specialNotes', e.target.value)}
                  helperText="Share anything special you'd like us to know"
                />

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    variant="wedding"
                    size="lg"
                    className={`w-full ${isTouchDevice ? 'min-h-[56px]' : ''} font-medium`}
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

                  {isMobile && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Your RSVP will be saved and you can update it anytime
                    </p>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
