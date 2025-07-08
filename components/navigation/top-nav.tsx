"use client"

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
  AlertTriangle,
  Sun
} from 'lucide-react'
import MagicLogo from '../magicui/MagicLogo'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'

export function TopNav(props: { darkMode?: boolean, setDarkMode?: (v: boolean) => void }) {
  const [notifications] = useState([
    { id: 1, title: 'Low performance alert', driver: 'Ahmed Hassan', type: 'warning', time: '2m ago' },
    { id: 2, title: 'New driver registered', driver: 'Sarah Ahmed', type: 'info', time: '5m ago' },
    { id: 3, title: 'High cancellation rate', driver: 'Mohammed Ali', type: 'critical', time: '10m ago' }
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const { data: session, status } = useSession()
  const user = session?.user
  const { darkMode = false, setDarkMode } = props || {}

  return (
    <div className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-50 via-white to-purple-50 border-b border-gray-200 shadow-sm dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:border-gray-700">
      {/* Logo and Search */}
      <div className="flex items-center gap-6 flex-1 min-w-0">
     
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search drivers, trips, alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full rounded-xl bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600 shadow-inner focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-400 dark:text-gray-100"
          />
        </div>
      </div>
      {/* Soft Divider */}
      <div className="mx-6 h-10 w-px bg-gradient-to-b from-blue-200 via-gray-200 to-purple-200 dark:from-blue-600 dark:via-gray-600 dark:to-purple-600 opacity-60 rounded-full" />
      {/* Actions and User */}
      <div className="flex items-center gap-3">
        {/* Quick Add Driver */}
        <Button asChild variant="outline" size="sm" className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg shadow-sm transition-all font-semibold">
          <Link href="/dashboard/drivers/add">
            <Plus className="h-4 w-4 mr-2" />
            Add Driver
          </Link>
        </Button>
        {/* Refresh Button */}
        <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </Button>
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
              <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-tr from-pink-400 via-purple-500 to-blue-500 text-white text-xs flex items-center justify-center shadow-lg animate-bounce">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            <DropdownMenuLabel className="flex items-center justify-between text-gray-900 dark:text-gray-100">
              <span>Notifications</span>
              <Badge variant="secondary" className="h-5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {notifications.length} new
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <div className="max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-gray-900 dark:text-gray-100">
                  <div className={`mt-0.5 h-2 w-2 rounded-full ${
                    notification.type === 'critical' 
                      ? 'bg-red-500' 
                      : notification.type === 'warning' 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Driver: {notification.driver}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {notification.time}
                    </p>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem className="text-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all">
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Quick Settings</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem onClick={() => setDarkMode && setDarkMode(!darkMode)} className="text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30">
              {darkMode ? (
                <Sun className="h-4 w-4 mr-2" />
              ) : (
                <Moon className="h-4 w-4 mr-2" />
              )}
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30">
              <Bell className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
              Notification Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-900 dark:text-gray-100 hover:bg-blue-50 dark:hover:bg-blue-900/30">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alert Preferences
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* User Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-blue-200 dark:hover:ring-blue-600 transition-all">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar.jpg" alt={user.name || "User"} />
                  <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                    {user.name ? user.name.slice(0,2).toUpperCase() : "MN"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl shadow-2xl border-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
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
              <DropdownMenuItem className="text-red-600" onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="outline" size="sm" className="rounded-lg font-semibold">Login</Button>
          </Link>
        )}
      </div>
    </div>
  )
} 