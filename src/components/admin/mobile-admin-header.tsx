'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useMobileDetection } from '@/hooks/use-mobile-detection'
import { useAdminAuth } from '@/components/admin-auth-provider'
import { 
  Menu, 
  LogOut, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Mail, 
  Image, 
  BarChart3,
  Settings,
  Heart,
  X
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Content',
    href: '/admin/content',
    icon: FileText,
  },
  {
    name: 'Guests',
    href: '/admin/guests',
    icon: Users,
  },
  {
    name: 'Communications',
    href: '/admin/communications',
    icon: Mail,
  },
  {
    name: 'Media',
    href: '/admin/media',
    icon: Image,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function MobileAdminHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile, isTouchDevice } = useMobileDetection()
  const { signOut } = useAdminAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/admin/login')
  }

  const currentPage = navigation.find(item => 
    pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
  )

  if (!isMobile) return null

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50 md:hidden">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side - Menu button and title */}
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className={`${isTouchDevice ? 'min-h-[44px] min-w-[44px]' : ''}`}
                aria-label="Open admin menu"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            
            <SheetContent side="left" className="w-full p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                  <div className="flex items-center gap-3">
                    <Heart className="w-6 h-6 text-primary" />
                    <div>
                      <h1 className="font-script text-lg text-primary">
                        Ashton & Cheyenne
                      </h1>
                      <p className="text-xs text-muted-foreground">Wedding Admin</p>
                    </div>
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
                  {navigation.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href !== '/admin' && pathname.startsWith(item.href))
                    
                    return (
                      <Button
                        key={item.name}
                        variant={isActive ? 'secondary' : 'ghost'}
                        asChild
                        className={`
                          w-full justify-start text-left h-12 px-4
                          ${isActive ? 'bg-primary/10 text-primary' : 'text-foreground'}
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
                    )
                  })}
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

          <div>
            <h1 className="font-script text-lg text-primary">
              {currentPage?.name || 'Admin'}
            </h1>
          </div>
        </div>

        {/* Right side - Quick actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/wedding')}
            className={`${isTouchDevice ? 'min-h-[44px]' : ''} text-xs`}
          >
            View Site
          </Button>
        </div>
      </div>
    </header>
  )
}
