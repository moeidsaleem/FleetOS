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
      "flex flex-col border-r border-gray-200 transition-all duration-300 bg-gradient-to-b from-blue-50 via-white to-purple-50 shadow-xl",
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
          className="h-8 w-8 p-0 hover:bg-blue-100 transition-colors"
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

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {menuItems.map((section, sectionIdx) => (
          <div key={sectionIdx} className="space-y-1">
            <div className="text-xs font-semibold text-gray-400 uppercase px-2 mb-2 tracking-wider">
              {section.title}
            </div>
            {section.items.map((item, itemIdx) => {
              const isActive = pathname === item.href
              return (
                <Link key={itemIdx} href={item.href} legacyBehavior>
                  <a
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-gray-700 hover:bg-blue-200/60 hover:shadow-lg transition-all duration-200 group",
                      isActive && "bg-blue-200/80 text-blue-700 font-bold shadow-lg scale-[1.03]"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110" />
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
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-100 mt-auto">
          <Button variant="ghost" size="sm" className="w-full flex items-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      )}
    </div>
  )
} 