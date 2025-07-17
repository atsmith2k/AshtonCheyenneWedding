'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Heart, Calendar, MapPin, ArrowRight, Mail } from 'lucide-react'
import { useAuth } from '@/components/providers'

export default function LandingPage() {
  const router = useRouter()
  const { user, guest, isLoading, signInWithInvitationCode } = useAuth()
  const [email, setEmail] = useState('')
  const [invitationCode, setInvitationCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showCodeEntry, setShowCodeEntry] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Forgot invitation code modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [recoveryError, setRecoveryError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // If user is already authenticated, redirect to main site
    if (user && guest) {
      router.push('/wedding')
    }
  }, [user, guest, router])

  if (!mounted) {
    return <div className="h-screen bg-gradient-to-br from-primary-50 to-secondary-50" />
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Check if email exists in guest list
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      })

      const result = await response.json()

      if (response.ok && result.exists) {
        // Email found, show invitation code entry
        setShowCodeEntry(true)
      } else {
        setError('Email not found in our guest list. Please check your email or contact us.')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
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
        router.push('/wedding')
      } else {
        setError(result.error || 'Invalid invitation code')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForgotCode = () => {
    setShowForgotModal(true)
    setRecoveryEmail('')
    setRecoveryMessage('')
    setRecoveryError('')
  }

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!recoveryEmail.trim()) {
      setRecoveryError('Please enter your email address')
      return
    }

    setIsRecoverySubmitting(true)
    setRecoveryError('')
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
        setRecoveryMessage(result.message || 'If this email is in our guest list, you will receive your invitation code shortly.')
        setRecoveryEmail('')
      } else {
        setRecoveryError(result.error || 'An unexpected error occurred. Please try again.')
      }
    } catch (error) {
      setRecoveryError('An unexpected error occurred. Please try again.')
    } finally {
      setIsRecoverySubmitting(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 wedding-hero-bg" />

      {/* Elegant Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        {/* Names */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-script text-6xl md:text-8xl lg:text-9xl text-primary mb-4 drop-shadow-sm">
            Ashton & Cheyenne
          </h1>
          <div className="flex items-center justify-center gap-4 text-primary/70">
            <div className="h-px bg-primary/30 w-16" />
            <Heart className="w-6 h-6 fill-current text-primary" />
            <div className="h-px bg-primary/30 w-16" />
          </div>
        </div>

        {/* Tagline */}
        <div className="mb-12 animate-slide-up">
          <p className="font-serif text-xl md:text-2xl text-foreground mb-2">
            Two Hearts, One Love Story
          </p>
          <p className="text-muted-foreground text-lg">
            Join us as we say "I Do" and begin our journey as husband and wife
          </p>
        </div>

        {/* Wedding Details Preview */}
        <div className="mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Card className="max-w-2xl mx-auto bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-center justify-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-card-foreground">Wedding Date</p>
                    <p className="text-muted-foreground">Coming Soon</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-card-foreground">Location</p>
                    <p className="text-muted-foreground">To Be Announced</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entry Gate Form */}
        <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Card className="max-w-md mx-auto bg-card/90 backdrop-blur-sm border-border/50 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-serif text-primary">
                {showCodeEntry ? 'Enter Your Invitation Code' : 'Welcome to Our Wedding'}
              </CardTitle>
              <p className="text-muted-foreground">
                {showCodeEntry 
                  ? 'Please enter the invitation code from your email'
                  : 'Please enter your email to access our wedding website'
                }
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showCodeEntry ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        placeholder="your.email@example.com"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="wedding"
                    size="lg"
                    className="w-full"
                    disabled={!email.trim() || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-medium">
                      Invitation Code
                    </Label>
                    <Input
                      id="code"
                      type="text"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      className="text-center text-lg tracking-wider uppercase"
                      placeholder="Enter your code"
                      maxLength={16}
                      autoComplete="off"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  {error && (
                    <p className="text-sm text-destructive text-center">
                      {error}
                    </p>
                  )}

                  <div className="space-y-3">
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

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setShowCodeEntry(false)
                        setInvitationCode('')
                        setError('')
                      }}
                    >
                      Back to Email Entry
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleForgotCode}
                        className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                      >
                        Forgot your invitation code?
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Need help? Contact us at{' '}
                  <a href="mailto:wedding@ashtonandcheyenne.com" className="text-primary hover:underline">
                    wedding@ashtonandcheyenne.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forgot Invitation Code Modal */}
      <Dialog open={showForgotModal} onOpenChange={setShowForgotModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Forgot Your Invitation Code?</DialogTitle>
            <DialogDescription className="text-center">
              Enter your email address and we'll send your invitation code if you're on our guest list.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecoverySubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email" className="text-sm font-medium">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="recovery-email"
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="pl-10"
                  placeholder="your.email@example.com"
                  disabled={isRecoverySubmitting}
                  required
                />
              </div>
            </div>

            {recoveryError && (
              <p className="text-sm text-destructive text-center">
                {recoveryError}
              </p>
            )}

            {recoveryMessage && (
              <p className="text-sm text-green-600 text-center">
                {recoveryMessage}
              </p>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                variant="wedding"
                size="lg"
                className="w-full"
                disabled={!recoveryEmail.trim() || isRecoverySubmitting}
              >
                {isRecoverySubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation Code'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowForgotModal(false)}
                disabled={isRecoverySubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
