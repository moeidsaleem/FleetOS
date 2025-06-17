import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
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
  HelpCircle,
  LogOut
} from 'lucide-react'

const menuItems = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Home',
        href: '/',
        icon: Home,
        description: 'System overview and status'
      },
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
      "flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-72",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className={cn(
          "flex items-center space-x-3 transition-opacity duration-300",
          isCollapsed && "opacity-0 w-0 overflow-hidden"
        )}>
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">Mr. Nice Drive</span>
              <span className="text-xs text-gray-500">Fleet Management</span>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Quick Stats */}
      {!isCollapsed && (
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
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {menuItems.map((section, sectionIndex) => (
          <div key={sectionIndex} className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item, itemIndex) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href))
                
                return (
                  <Link key={itemIndex} href={item.href}>
                    <div className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}>
                      <item.icon className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                      )} />
                      {!isCollapsed && (
                        <>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span>{item.title}</span>
                              {item.badge && (
                                <Badge 
                                  variant={item.badge === 'Warning' ? 'destructive' : 'default'}
                                  className="h-4 text-xs ml-2"
                                >
                                  {item.badge === 'Warning' ? '!' : '●'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
            {sectionIndex < menuItems.length - 1 && !isCollapsed && (
              <Separator className="my-4" />
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 p-4">
        {!isCollapsed ? (
          <div className="space-y-2">
            <Button variant="ghost" className="w-full justify-start text-sm">
              <HelpCircle className="h-4 w-4 mr-3" />
              Help & Support
            </Button>
            <Button variant="ghost" className="w-full justify-start text-sm text-red-600 hover:text-red-700">
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button variant="ghost" size="sm" className="w-full p-2">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="w-full p-2 text-red-600">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
} 