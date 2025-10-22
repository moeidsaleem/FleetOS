'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Zap, Shield, Activity, AlertTriangle, CheckCircle, Clock, MapPin, Sparkles } from 'lucide-react'
import { RequireAuth } from '@/components/auth/require-auth'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string
  content: string
  sender: 'user' | 'ai'
  timestamp: Date
  type?: 'text' | 'command' | 'status' | 'alert'
}

interface FleetStatus {
  totalDrivers: number
  activeDrivers: number
  alerts: number
  avgPerformance: number
}

export default function CommandCenterPage() {
  return (
    <RequireAuth>
      <CommandCenter />
    </RequireAuth>
  )
}

function CommandCenter() {
  const [fleetStatus, setFleetStatus] = useState<FleetStatus>({
    totalDrivers: 0,
    activeDrivers: 0,
    alerts: 0,
    avgPerformance: 0
  })
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Chat state management
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant' as const,
      content: 'Welcome to Fleet Command Center! I\'m your AI Fleet Commander powered by advanced AI. How can I assist you with your fleet operations today?'
    }
  ])

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          fleetData: fleetStatus
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.message || 'I apologize, but I couldn\'t process your request at the moment.'
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'I apologize, but I encountered an error. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus()
  }, [])

  // Fetch fleet data
  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/drivers?limit=1000')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            const drivers = data.data
            const activeDrivers = drivers.filter((d: any) => d.status === 'ACTIVE').length
            const avgScore = drivers.reduce((sum: number, d: any) => sum + (d.currentScore || 0), 0) / drivers.length
            
            setFleetStatus({
              totalDrivers: drivers.length,
              activeDrivers: activeDrivers,
              alerts: drivers.reduce((sum: number, d: any) => sum + (d.recentAlertsCount || 0), 0),
              avgPerformance: Math.round(avgScore * 100) || 0
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch fleet data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFleetData()
  }, [])

  const quickActions = [
    { label: 'Fleet Status', icon: Activity, command: 'Show me the current fleet status and key metrics' },
    { label: 'Send Alert', icon: AlertTriangle, command: 'Help me send an alert to a driver' },
    { label: 'Performance', icon: Zap, command: 'Generate a performance report for my drivers' },
    { label: 'Sync Data', icon: Shield, command: 'Sync the latest data from Uber API' }
  ]

  const handleQuickAction = (command: string) => {
    setInput(command)
    // Auto-submit after setting the input
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Fleet Command Center
                <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">Bachman Inc. • Advanced AI Fleet Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Online
            </Badge>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-900 dark:text-white">Fleet Commander AI</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">v2.1.0</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <Card className={`max-w-[80%] ${
                      message.role === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      <CardContent className="p-3">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {new Date().toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>

                    {message.role === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-slate-600 text-white">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 justify-start"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-sm text-slate-500">Fleet Commander AI is thinking...</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
            <div className="max-w-4xl mx-auto">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">Quick Actions:</p>
              <div className="flex gap-2 flex-wrap">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.command)}
                    className="flex items-center gap-2"
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                placeholder="Ask your Fleet Commander AI anything..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Fleet Overview</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Bachman Inc. Fleet Operations</p>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Live Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Total Drivers</span>
                      <span className="font-semibold">{fleetStatus.totalDrivers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Active</span>
                      <span className="font-semibold text-green-600">{fleetStatus.activeDrivers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">Alerts</span>
                      <span className="font-semibold text-red-600">{fleetStatus.alerts}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-20 mx-auto" />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{fleetStatus.avgPerformance}%</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">Average Score</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  • System synced with Uber API
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  • {fleetStatus.alerts} alerts processed
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  • Performance report generated
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  • Command Center online
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Database</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Uber API</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Synced
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">AI Engine</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
