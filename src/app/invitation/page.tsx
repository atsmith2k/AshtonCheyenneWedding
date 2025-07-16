'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/providers'
import { Heart, Key, ArrowRight, Home } from 'lucide-react'

export default function InvitationPage() {
  const router = useRouter()
  const { user, guest, signInWithInvitationCode, isLoading } = useAuth()
  const [invitationCode, setInvitationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (user && guest) {
      router.push('/')
    }
  }, [user, guest, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invitationCode.trim()) {
      setError('Please enter your invitation code')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await signInWithInvitationCode(invitationCode.trim())
      
      if (result.success) {
        // Redirect to home page after successful authentication
        router.push('/')
      } else {
        setError(result.error || 'Invalid invitation code')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-200 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary-200 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-100 rounded-full blur-2xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mb-6">
            <Heart className="w-16 h-16 text-primary-500 mx-auto mb-4" />
            <h1 className="font-script text-4xl text-primary-600 mb-2">
              Ashton & Cheyenne
            </h1>
            <p className="text-neutral-600">Wedding Invitation</p>
          </div>
        </div>

        {/* Invitation Form */}
        <div className="wedding-card p-8 animate-slide-up">
          <div className="text-center mb-8">
            <Key className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h2 className="font-serif text-2xl text-neutral-800 mb-2">
              Enter Your Invitation Code
            </h2>
            <p className="text-neutral-600 text-sm">
              Please enter the unique code from your wedding invitation to access our website.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="invitation-code" className="block text-sm font-medium text-neutral-700 mb-3">
                Invitation Code
              </label>
              <input
                type="text"
                id="invitation-code"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value)}
                className="wedding-input text-center text-lg tracking-wider uppercase"
                placeholder="Enter your code"
                maxLength={16}
                autoComplete="off"
                disabled={isSubmitting}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 text-center">
                  {error}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="wedding"
              size="lg"
              className="w-full"
              disabled={!invitationCode.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Verifying...
                </>
              ) : (
                <>
                  Access Wedding Website
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-neutral-200">
            <div className="text-center">
              <p className="text-sm text-neutral-600 mb-4">
                Don't have an invitation code?
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Return to Homepage
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="wedding-card p-6">
            <h3 className="font-medium text-neutral-800 mb-3">
              Need Help?
            </h3>
            <div className="text-sm text-neutral-600 space-y-2">
              <p>
                Your invitation code can be found on your wedding invitation or save-the-date card.
              </p>
              <p>
                If you can't find your code or are having trouble accessing the site, 
                please contact Ashton and Cheyenne directly.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-neutral-500 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p>
            We can't wait to celebrate with you! 💕
          </p>
        </div>
      </div>
    </div>
  )
}
