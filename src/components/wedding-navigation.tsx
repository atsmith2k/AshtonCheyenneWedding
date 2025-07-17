'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/components/providers'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import {
  Menu,
  LogOut,
  Home,
  Calendar,
  Users,
  Camera,
  MessageCircle,
  ArrowLeft,
  X
} from 'lucide-react'

interface WeddingNavigationProps {
  showBackButton?: boolean
  backUrl?: string
  title?: string
}

export function WeddingNavigation({
  showBackButton = false,
  backUrl = '/wedding',
  title
}: WeddingNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { guest, signOut } = useAuth()
  const { isMobile, isTouchDevice } = useMobileDetection()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Handle scroll effect for mobile header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push('/landing')
  }

  const navigationItems = [
    {
      name: 'Home',
      href: '/wedding',
      icon: Home,
      current: pathname === '/wedding'
    },
    {
      name: 'Wedding Details',
      href: '/wedding/details',
      icon: Calendar,
      current: pathname === '/wedding/details'
    },
    {
      name: 'RSVP',
      href: '/wedding/rsvp',
      icon: Users,
      current: pathname === '/wedding/rsvp'
    },
    {
      name: 'Photos',
      href: '/wedding/photos',
      icon: Camera,
      current: pathname === '/wedding/photos'
    },
    {
      name: 'Contact',
      href: '/wedding/contact',
      icon: MessageCircle,
      current: pathname === '/wedding/contact'
    }
  ]

  return (
    <header className={`
      bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50 transition-all duration-200
      ${isScrolled ? 'shadow-md bg-white/95' : ''}
      ${isMobile ? 'h-14' : 'h-16'}
    `}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between items-center ${isMobile ? 'h-14' : 'h-16'}`}>
          {/* Left side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size={isMobile ? "sm" : "sm"}
                onClick={() => router.push(backUrl)}
                className={`${isTouchDevice ? 'min-h-[44px] min-w-[44px]' : ''}`}
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                {!isMobile && 'Back'}
              </Button>
            )}
            <h1 className={`font-script text-primary ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {title || 'Ashton & Cheyenne'}
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.name}
                variant={item.current ? 'secondary' : 'ghost'}
                asChild
                className={item.current ? 'bg-primary/10 text-primary' : ''}
              >
                <a href={item.href} className="flex items-center gap-2">
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </a>
              </Button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Guest info - hidden on mobile */}
            <div className="hidden sm:block">
              <span className="text-sm text-muted-foreground">
                Welcome, {guest?.first_name}!
              </span>
            </div>

            {/* Sign out button - desktop */}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden md:flex">
              <LogOut className="w-4 h-4" />
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`md:hidden ${isTouchDevice ? 'min-h-[44px] min-w-[44px]' : ''}`}
                  aria-label="Open navigation menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className={`${isMobile ? 'w-full' : 'w-80'} p-0`}>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b">
                    <div>
                      <h2 className="font-script text-xl text-primary">
                        Ashton & Cheyenne
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Welcome, {guest?.first_name}!
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`${isTouchDevice ? 'min-h-[44px] min-w-[44px]' : ''}`}
                      aria-label="Close menu"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 p-6 space-y-1">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.name}
                        variant={item.current ? 'secondary' : 'ghost'}
                        asChild
                        className={`
                          w-full justify-start text-left h-12 px-4
                          ${item.current ? 'bg-primary/10 text-primary' : 'text-foreground'}
                          ${isTouchDevice ? 'min-h-[48px]' : ''}
                          hover:bg-accent hover:text-accent-foreground
                          transition-colors duration-200
                        `}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <a href={item.href} className="flex items-center gap-4 w-full">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.name}</span>
                        </a>
                      </Button>
                    ))}
                  </nav>

                  {/* Footer */}
                  <div className="border-t p-6">
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className={`
                        w-full justify-start text-muted-foreground h-12 px-4
                        ${isTouchDevice ? 'min-h-[48px]' : ''}
                        hover:bg-destructive/10 hover:text-destructive
                        transition-colors duration-200
                      `}
                    >
                      <LogOut className="w-5 h-5 mr-4 flex-shrink-0" />
                      <span className="font-medium">Sign Out</span>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}

export default WeddingNavigation
