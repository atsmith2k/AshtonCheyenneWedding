'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/components/providers'
import { 
  Menu, 
  LogOut, 
  Home, 
  Calendar, 
  Users, 
  Camera, 
  MessageCircle,
  ArrowLeft 
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <header className="bg-white/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button variant="ghost" size="sm" onClick={() => router.push(backUrl)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <h1 className="font-script text-2xl text-primary">
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
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="border-b pb-4 mb-6">
                    <h2 className="font-script text-2xl text-primary">
                      Ashton & Cheyenne
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Welcome, {guest?.first_name}!
                    </p>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 space-y-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.name}
                        variant={item.current ? 'secondary' : 'ghost'}
                        asChild
                        className={`w-full justify-start ${
                          item.current ? 'bg-primary/10 text-primary' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <a href={item.href} className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          {item.name}
                        </a>
                      </Button>
                    ))}
                  </nav>

                  {/* Footer */}
                  <div className="border-t pt-4">
                    <Button
                      variant="ghost"
                      onClick={handleSignOut}
                      className="w-full justify-start text-muted-foreground"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sign Out
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
