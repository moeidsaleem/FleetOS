'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Separator } from '../components/ui/separator'
import { QuickActions } from '../components/ui/quick-actions'
import { 
  Shield, 
  Target, 
  AlertTriangle, 
  Database,
  BarChart3,
  Settings,
  CheckCircle,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react'
import Hero from '../components/magicui/Hero'
import FeatureGrid from '../components/magicui/FeatureGrid'

export default function HomePage() {
  const features = [
    {
      icon: Target,
      title: 'Advanced Scoring Engine',
      description: 'Weighted 6-metric formula with real-time performance tracking',
      details: ['Acceptance Rate (30%)', 'Cancellation Rate (20%)', 'Completion Rate (15%)', 'Feedback Score (15%)', 'Trip Volume (10%)', 'Idle Ratio (10%)']
    },
    {
      icon: AlertTriangle,
      title: 'Multi-Channel Alerts',
      description: 'Smart alert prioritization across WhatsApp, Voice, and Telegram',
      details: ['Critical: Voice + WhatsApp + Telegram', 'High: WhatsApp + Telegram', 'Medium: WhatsApp', 'Low: WhatsApp']
    },
    {
      icon: BarChart3,
      title: 'Real-time Dashboard',
      description: 'Comprehensive analytics and performance monitoring',
      details: ['Performance Trends', 'Driver Rankings', 'Alert Analytics', 'Channel Effectiveness']
    },
    {
      icon: Database,
      title: 'Uber Fleet Integration',
      description: 'Direct API integration with automatic data synchronization',
      details: ['Real-time Metrics', 'Trip Data', 'Driver Status', 'Performance History']
    }
  ]

  const systemStatus = [
    { label: 'Scoring Engine', status: 'operational', description: 'All metrics calculating correctly' },
    { label: 'Alert System', status: 'operational', description: 'Multi-channel delivery active' },
    { label: 'Uber API', status: 'operational', description: 'Data sync successful' },
    { label: 'Database', status: 'operational', description: 'PostgreSQL running smoothly' }
  ]

  const quickStats = [
    { label: 'Active Drivers', value: '62', trend: '+3 this week', icon: Users },
    { label: 'Avg Performance', value: '84.2%', trend: '+2.1% from last week', icon: Target },
    { label: 'Alerts Sent Today', value: '12', trend: '3 responded', icon: AlertTriangle },
    { label: 'System Uptime', value: '99.9%', trend: 'Last 30 days', icon: Activity }
  ]

  const navigationItems = [
    { title: 'Dashboard', href: '/dashboard', description: 'Analytics & insights', icon: BarChart3 },
    { title: 'Drivers', href: '/dashboard/drivers', description: 'Manage fleet drivers', icon: Users },
    { title: 'Alerts', href: '/dashboard/alerts', description: 'Alert management', icon: AlertTriangle },
    { title: 'Settings', href: '/dashboard/settings', description: 'System configuration', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-gray-900">Mr. Nice Drive</span>
                  <span className="text-xs text-gray-500">Fleet Management System</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">v0.2.0</Badge>
            </div>
            <div className="flex items-center space-x-4">
              {navigationItems.map((item, index) => (
                <Link key={index} href={item.href}>
                  <Button variant="ghost" size="sm" className="hidden md:flex">
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.title}
                  </Button>
                </Link>
              ))}
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Open Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Quick Stats */}
      <section className="py-16 bg-white/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Live System Overview</h2>
            <p className="text-gray-600">Real-time performance metrics and system status</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {quickStats.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-blue-600">{stat.value}</CardTitle>
                  <CardDescription className="font-medium">{stat.label}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {stat.trend}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions and System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuickActions />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  System Status
                </CardTitle>
                <CardDescription>All systems operational</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStatus.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        Operational
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <FeatureGrid features={features} />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">Mr. Nice Drive</span>
              </div>
              <p className="text-gray-400">
                Advanced fleet management system for Dubai&apos;s premium limousine service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                {navigationItems.map((item, index) => (
                  <Link key={index} href={item.href} className="block text-gray-400 hover:text-white transition-colors">
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">System Info</h3>
              <div className="space-y-2 text-gray-400">
                <p>Version 2.0</p>
                <p>Last Updated: Today</p>
                <p>Status: All Systems Operational</p>
              </div>
            </div>
          </div>
          <Separator className="my-8 bg-gray-700" />
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Mr. Nice Drive Fleet Management. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
