"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '../ui/button'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'
import { Badge } from '../ui/badge'
import { 
  Menu,
  Home,
  LayoutDashboard,
  Users,
  UserPlus,
  Car,
  AlertTriangle,
  BarChart3,
  Settings,
  Shield,
  Target,
  X
} from 'lucide-react'
import MagicLogo from '../magicui/MagicLogo'

const mobileMenuItems = [
  { title: 'Home', href: '/', icon: Home },
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Drivers', href: '/dashboard/drivers', icon: Users, badge: true },
  { title: 'Add Driver', href: '/dashboard/drivers/add', icon: UserPlus },
  { title: 'Performance', href: '/dashboard/performance', icon: Target },
  { title: 'Active Trips', href: '/dashboard/trips', icon: Car },
  { title: 'Alerts', href: '/dashboard/alerts', icon: AlertTriangle, badge: true },
  { title: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings }
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0 w-80">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <MagicLogo size={32} />
              <div className="flex flex-col">
                <span className="font-bold text-gray-900">Fleet OS</span>
                <span className="text-xs text-gray-500">AI Fleet Management System</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="p-4 border-b border-gray-100">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Active Drivers</span>
                <span className="font-semibold text-green-600">62</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pending Alerts</span>
                <Badge variant="destructive" className="h-5 text-xs">3</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">System Status</span>
                <Badge variant="default" className="h-5 text-xs bg-green-500">Online</Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {mobileMenuItems.map((item, index) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link key={index} href={item.href} onClick={() => setOpen(false)}>
                    <div className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}>
                      <item.icon className={`h-5 w-5 ${
                        isActive ? "text-blue-600" : "text-gray-500"
                      }`} />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge 
                          variant="destructive" 
                          className="h-4 w-4 rounded-full p-0 text-xs"
                        >
                          !
                        </Badge>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="text-center text-xs text-gray-500">
              Fleet OS v1.0
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 