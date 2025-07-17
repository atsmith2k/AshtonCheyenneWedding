'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/components/providers'
import { Heart, Key, ArrowRight, Home } from 'lucide-react'

function InvitationPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, guest, signInWithInvitationCode, isLoading } = useAuth()
  const [invitationCode, setInvitationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState('')

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (user && guest) {
      router.push('/')
    }
  }, [user, guest, router])

  useEffect(() => {
    // Pre-fill invitation code from URL parameter
    const codeParam = searchParams.get('code')
    if (codeParam) {
      setInvitationCode(codeParam.trim().toUpperCase())
    }
  }, [searchParams])

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

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryEmail.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsRecovering(true)
    setError('')
    setRecoveryMessage('')

    try {
      const response = await fetch('/api/auth/recover-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: recoveryEmail.trim() })
      })

      const result = await response.json()

      if (response.ok) {
        setRecoveryMessage(result.message)
        setRecoveryEmail('')
      } else {
        setError(result.error || 'Failed to send recovery email')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsRecovering(false)
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
            <Heart className="w-16 h-16 text-primary mx-auto mb-4" />
            <h1 className="font-script text-4xl text-primary mb-2">
              Ashton & Cheyenne
            </h1>
            <p className="text-muted-foreground">Wedding Invitation</p>
          </div>
        </div>

        {/* Invitation Form */}
        <Card className="animate-slide-up bg-card/80 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <Key className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className="font-serif text-2xl text-card-foreground">
              Enter Your Invitation Code
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Please enter the unique code from your wedding invitation to access our website.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="invitation-code" className="text-sm font-medium text-card-foreground">
                  Invitation Code
                </Label>
                <Input
                  type="text"
                  id="invitation-code"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value)}
                  className="text-center text-lg tracking-wider uppercase"
                  placeholder="Enter your code"
                  maxLength={16}
                  autoComplete="off"
                  disabled={isSubmitting}
                />
                {error && (
                  <p className="mt-2 text-sm text-destructive text-center">
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

          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Lost your invitation code?
              </p>
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRecovery(!showRecovery)}
                  className="mr-3"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Recover Code via Email
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Return to Homepage
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Recovery Form */}
        {showRecovery && (
          <div className="mt-8 animate-fade-in">
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="font-medium text-card-foreground text-center">
                  Recover Your Invitation Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRecovery} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recovery-email" className="text-sm font-medium text-card-foreground">
                      Email Address
                    </Label>
                    <Input
                      type="email"
                      id="recovery-email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="Enter the email address from your invitation"
                      disabled={isRecovering}
                      required
                    />
                  </div>
                <Button
                  type="submit"
                  variant="wedding"
                  size="sm"
                  className="w-full"
                  disabled={!recoveryEmail.trim() || isRecovering}
                >
                  {isRecovering ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation Code'
                  )}
                </Button>
                  {recoveryMessage && (
                    <p className="text-sm text-green-600 text-center mt-2">
                      {recoveryMessage}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <CardTitle className="font-medium text-card-foreground mb-3">
                Need Help?
              </CardTitle>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  Your invitation code can be found on your wedding invitation or save-the-date card.
                </p>
                <p>
                  If you can't find your code or are having trouble accessing the site,
                  please contact Ashton and Cheyenne directly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p>
            We can't wait to celebrate with you! 💕
          </p>
        </div>
      </div>
    </div>
  )
}

export default function InvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <Heart className="w-8 h-8 text-pink-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <InvitationPageContent />
    </Suspense>
  )
}
