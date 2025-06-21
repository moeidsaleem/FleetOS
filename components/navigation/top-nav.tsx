import { useState } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Input } from '../ui/input'
import {
  Bell,
  Search,
  Settings,
  User,
  LogOut,
  HelpCircle,
  Moon,
  RefreshCw,
  Plus,
  AlertTriangle
} from 'lucide-react'
import MagicLogo from '../magicui/MagicLogo'

export function TopNav() {
  const [notifications] = useState([
    { id: 1, title: 'Low performance alert', driver: 'Ahmed Hassan', type: 'warning', time: '2m ago' },
    { id: 2, title: 'New driver registered', driver: 'Sarah Ahmed', type: 'info', time: '5m ago' },
    { id: 3, title: 'High cancellation rate', driver: 'Mohammed Ali', type: 'critical', time: '10m ago' }
  ])

  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-50 via-white to-purple-50 border-b border-gray-200 shadow-sm">
      {/* Logo and Search */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <MagicLogo size={44} />
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight drop-shadow-sm">Mr. Nice Drive</span>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search drivers, trips, alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-xl bg-white/80 border border-gray-200 shadow-inner focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </div>
      {/* Soft Divider */}
      <div className="mx-6 h-10 w-px bg-gradient-to-b from-blue-200 via-gray-200 to-purple-200 opacity-60 rounded-full" />
      {/* Actions and User */}
      <div className="flex items-center gap-3">
        {/* Quick Add Driver */}
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-100 rounded-lg shadow-sm transition-all font-semibold">
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
        {/* Refresh Button */}
        <Button variant="ghost" size="sm" className="hover:bg-blue-100 rounded-lg transition-all">
          <RefreshCw className="h-4 w-4" />
        </Button>
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative hover:bg-blue-100 rounded-lg transition-all">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-tr from-pink-400 via-purple-500 to-blue-500 text-white text-xs flex items-center justify-center shadow-lg animate-bounce">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-2xl border-0 bg-white/90 backdrop-blur-md">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <Badge variant="secondary" className="h-5 text-xs">
                {notifications.length} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-all">
                  <div className={`mt-0.5 h-2 w-2 rounded-full ${
                    notification.type === 'critical' 
                      ? 'bg-red-500' 
                      : notification.type === 'warning' 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Driver: {notification.driver}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {notification.time}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-blue-600 hover:text-blue-700">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hover:bg-blue-100 rounded-lg transition-all">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border-0 bg-white/90 backdrop-blur-md">
            <DropdownMenuLabel>Quick Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Moon className="h-4 w-4 mr-2" />
              Dark Mode
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Bell className="h-4 w-4 mr-2" />
              Notification Settings
            </DropdownMenuItem>
            <DropdownMenuItem>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alert Preferences
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-blue-200 transition-all">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.jpg" alt="User" />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  MN
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-xl shadow-2xl border-0 bg-white/90 backdrop-blur-md" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Mr. Nice Drive Admin</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@mrniceguy.ae
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
} 