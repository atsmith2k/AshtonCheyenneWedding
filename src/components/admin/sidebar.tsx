'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Users,
  Mail,
  Image,
  BarChart3,
  Settings,
  Heart
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: any
  subItems?: Array<{
    name: string
    href: string
  }>
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Content Management',
    href: '/admin/content',
    icon: FileText,
  },
  {
    name: 'Guest Management',
    href: '/admin/guests',
    icon: Users,
    subItems: [
      {
        name: 'All Guests',
        href: '/admin/guests',
      },
      {
        name: 'RSVP Management',
        href: '/admin/guests/rsvp',
      },
    ],
  },
  {
    name: 'Communications',
    href: '/admin/communications',
    icon: Mail,
  },
  {
    name: 'Media Management',
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

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="admin-sidebar w-64 min-h-screen">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="font-script text-xl text-primary-600">
              Ashton & Cheyenne
            </h1>
            <p className="text-xs text-neutral-500">Wedding Admin</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'admin-nav-item',
                    isActive && 'active'
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>

                {/* Sub-items */}
                {item.subItems && isActive && (
                  <div className="ml-8 mt-1 space-y-1">
                    {item.subItems.map((subItem) => {
                      const isSubActive = pathname === subItem.href
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={cn(
                            'block px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors',
                            isSubActive && 'text-primary font-medium'
                          )}
                        >
                          {subItem.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
