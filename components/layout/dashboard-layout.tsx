'use client'

import { Sidebar } from '../navigation/sidebar'
import { TopNav } from '../navigation/top-nav'
import { MobileNav } from '../navigation/mobile-nav'
import { Breadcrumb } from '../navigation/breadcrumb'
import { cn } from '../../lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation with Mobile Menu */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center px-4 lg:px-6 py-4">
            {/* Mobile Navigation */}
            <div className="lg:hidden mr-4">
              <MobileNav />
            </div>
            
            {/* Desktop Top Navigation */}
            <div className="flex-1">
              <TopNav />
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <main className={cn("flex-1 p-4 lg:p-6", className)}>
          {/* Breadcrumb */}
          <Breadcrumb />
          
          {/* Page Content */}
          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
} 