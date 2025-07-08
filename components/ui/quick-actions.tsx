import Link from 'next/link'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { 
  UserPlus, 
  AlertTriangle, 
  BarChart3, 
  MessageSquare, 
  RefreshCw,
  Download,
  Settings,
  Plus
} from 'lucide-react'

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'destructive' | 'outline' | 'secondary'
  badge?: string
}

const quickActions: QuickAction[] = [
  {
    title: 'Add New Driver',
    description: 'Register a new driver in the system',
    href: '/dashboard/drivers/add',
    icon: UserPlus,
    variant: 'default'
  },
  {
    title: 'View Alerts',
    description: 'Check pending driver alerts',
    href: '/dashboard/alerts',
    icon: AlertTriangle,
    variant: 'destructive',
    badge: '3'
  },
  {
    title: 'Generate Report',
    description: 'Create performance reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    variant: 'outline'
  },
  {
    title: 'Send Message',
    description: 'Broadcast to all drivers',
    href: '/dashboard/communications',
    icon: MessageSquare,
    variant: 'secondary'
  }
]

interface QuickActionsProps {
  className?: string
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Common tasks and shortcuts for fleet management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button 
              key={index}
              variant={action.variant} 
              className="w-full justify-start h-auto p-4 relative"
              asChild
            >
              <Link href={action.href}>
                <div className="flex items-center gap-3">
                  <action.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </div>
                {action.badge && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    {action.badge}
                  </Badge>
                )}
              </Link>
            </Button>
          ))}
        </div>
        
        {/* Additional Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button variant="ghost" size="sm" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Data
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 