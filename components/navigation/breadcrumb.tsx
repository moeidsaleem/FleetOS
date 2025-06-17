import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../../lib/utils'

interface BreadcrumbItem {
  title: string
  href?: string
  isLast?: boolean
}

const routeMapping: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/dashboard/drivers': 'Drivers',
  '/dashboard/drivers/add': 'Add Driver',
  '/dashboard/performance': 'Performance',
  '/dashboard/trips': 'Active Trips',
  '/dashboard/alerts': 'Alerts',
  '/dashboard/communications': 'Communications',
  '/dashboard/reports': 'Reports',
  '/dashboard/insights': 'Insights',
  '/dashboard/export': 'Export Data',
  '/dashboard/uber': 'Uber Integration',
  '/dashboard/settings': 'Settings',
  '/dashboard/status': 'API Status'
}

export function Breadcrumb() {
  const pathname = usePathname()
  
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    
    // Always start with home if not on home page
    if (pathname !== '/') {
      breadcrumbs.push({ title: 'Home', href: '/' })
    }
    
    // Build breadcrumbs from path segments
    let currentPath = ''
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const title = routeMapping[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1)
      const isLast = index === pathSegments.length - 1
      
      breadcrumbs.push({
        title,
        href: isLast ? undefined : currentPath,
        isLast
      })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  if (breadcrumbs.length <= 1) return null
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500 mb-6">
      <Home className="h-4 w-4" />
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link 
              href={item.href}
              className="hover:text-gray-700 transition-colors"
            >
              {item.title}
            </Link>
          ) : (
            <span className={cn(
              "font-medium",
              item.isLast ? "text-gray-900" : "text-gray-500"
            )}>
              {item.title}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
} 