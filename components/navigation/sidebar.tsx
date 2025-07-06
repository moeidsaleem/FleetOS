"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
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
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileText,
  Database,
  Globe,
  LogOut
} from 'lucide-react'
import MagicLogo from '../magicui/MagicLogo'

const menuItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Analytics and insights'
      }
    ]
  },
  {
    title: 'Driver Management',
    items: [
      {
        title: 'All Drivers',
        href: '/dashboard/drivers',
        icon: Users,
        description: 'View and manage drivers',
        badge: 'Primary'
      },
      {
        title: 'Add Driver',
        href: '/dashboard/drivers/add',
        icon: UserPlus,
        description: 'Register new driver'
      },
      {
        title: 'Performance',
        href: '/dashboard/performance',
        icon: Target,
        description: 'Driver scoring metrics'
      }
    ]
  },
  {
    title: 'Fleet Operations',
    items: [
      {
        title: 'Active Trips',
        href: '/dashboard/trips',
        icon: Car,
        description: 'Monitor live trips'
      },
      {
        title: 'Alerts',
        href: '/dashboard/alerts',
        icon: AlertTriangle,
        description: 'Alert management',
        badge: 'Warning'
      },
      {
        title: 'Communications',
        href: '/dashboard/communications',
        icon: MessageSquare,
        description: 'WhatsApp & Telegram'
      }
    ]
  },
  {
    title: 'Analytics',
    items: [
      {
        title: 'Reports',
        href: '/dashboard/reports',
        icon: BarChart3,
        description: 'Performance reports'
      },
      {
        title: 'Insights',
        href: '/dashboard/insights',
        icon: Activity,
        description: 'Data analytics'
      },
      {
        title: 'Export Data',
        href: '/dashboard/export',
        icon: FileText,
        description: 'Data export tools'
      }
    ]
  },
  {
    title: 'System',
    items: [
      {
        title: 'Uber Integration',
        href: '/dashboard/uber',
        icon: Database,
        description: 'Fleet API management'
      },
      {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
        description: 'System configuration'
      },
      {
        title: 'API Status',
        href: '/dashboard/status',
        icon: Globe,
        description: 'Service monitoring'
      }
    ]
  }
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex flex-col transition-all duration-300 bg-card/80 shadow-xl backdrop-blur-lg border border-border animate-fadein",
      isCollapsed ? "w-16" : "w-72",
      "rounded-r-3xl m-2 ml-0 h-[calc(100vh-1rem)]",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className={cn(
          "flex items-center space-x-3 transition-opacity duration-300",
          isCollapsed && "opacity-0 w-0 overflow-hidden"
        )}>
          <div className="flex items-center space-x-2">
            <MagicLogo size={32} />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">Fleet OS</span>
              <span className="text-xs text-muted-foreground">AI Fleet Management System</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0 hover:bg-muted transition-colors transform-gpu duration-300 hover:scale-110"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick Stats */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active Drivers</span>
              <span className="font-semibold text-green-600">62</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending Alerts</span>
              <Badge variant="destructive" className="h-5 text-xs">3</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">System Status</span>
              <Badge variant="default" className="h-5 text-xs bg-green-500">Online</Badge>
            </div>
          </div>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {menuItems.map((section, sectionIdx) => {
          const SectionIcon = section.items[0]?.icon;
          return (
            <div key={sectionIdx} className="space-y-1">
              <div className={cn(
                "flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase px-2 mb-2 tracking-wider",
                isCollapsed && "hidden"
              )}>
                {SectionIcon && <SectionIcon className="h-4 w-4 opacity-70" />} {section.title}
              </div>
              {section.items.map((item, itemIdx) => {
                const isActive = pathname === item.href
                return (
                  <Link key={itemIdx} href={item.href} legacyBehavior>
                    <a
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-xl text-foreground hover:bg-muted hover:shadow-lg transition-all duration-200 group relative overflow-hidden",
                        isActive && "bg-muted font-bold shadow-lg scale-[1.03] ring-2 ring-blue-400/70 ring-offset-2 ring-offset-card before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-400/20 before:to-purple-400/20 before:blur before:opacity-60 before:rounded-xl"
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-125 duration-200" />
                      <span className={cn(
                        "flex-1 text-base truncate",
                        isCollapsed && "hidden"
                      )}>{item.title}</span>
                      {item.badge && !isCollapsed && (
                        <Badge variant={item.badge === 'Warning' ? 'destructive' : 'default'} className="ml-2 text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </a>
                  </Link>
                )
              })}
              {/* Soft divider between sections */}
              {sectionIdx < menuItems.length - 1 && !isCollapsed && (
                <div className="my-3 h-px bg-gradient-to-r from-blue-200 via-card to-purple-200 opacity-40 rounded-full" />
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border mt-auto">
          <Button variant="ghost" size="sm" className="w-full flex items-center gap-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </div>
  )
} 