'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Zap, Shield, Activity, AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react'
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
      <DashboardLayout>
        <CommandCenter />
      </DashboardLayout>
    </RequireAuth>
  )
}

function CommandCenter() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Welcome to Fleet Command Center! I\'m your AI Fleet Commander. How can I assist you with your fleet operations today?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [fleetStatus, setFleetStatus] = useState<FleetStatus>({
    totalDrivers: 0,
    activeDrivers: 0,
    alerts: 0,
    avgPerformance: 0
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.content,
        sender: 'ai',
        timestamp: new Date(),
        type: aiResponse.type || 'text'
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (input: string): { content: string; type?: string } => {
    const lowerInput = input.toLowerCase()
    
    if (lowerInput.includes('status') || lowerInput.includes('fleet')) {
      return {
        content: `🚀 **Fleet Status Report**\n\n📊 **Current Fleet Overview:**\n• Total Drivers: ${fleetStatus.totalDrivers}\n• Active Drivers: ${fleetStatus.activeDrivers}\n• Pending Alerts: ${fleetStatus.alerts}\n• Average Performance: ${fleetStatus.avgPerformance}%\n\nAll systems operational! ✅`,
        type: 'status'
      }
    }
    
    if (lowerInput.includes('alert') || lowerInput.includes('warning')) {
      return {
        content: `🚨 **Alert Management**\n\nI can help you:\n• Send alerts to specific drivers\n• Check alert history\n• Monitor performance issues\n• Set up automated alerts\n\nWould you like me to send an alert to any drivers?`,
        type: 'alert'
      }
    }
    
    if (lowerInput.includes('performance') || lowerInput.includes('score')) {
      return {
        content: `📈 **Performance Analysis**\n\nHere's what I can analyze:\n• Driver performance scores\n• Trip completion rates\n• Customer feedback trends\n• Efficiency metrics\n\nWould you like a detailed performance report?`,
        type: 'command'
      }
    }
    
    if (lowerInput.includes('help') || lowerInput.includes('commands')) {
      return {
        content: `🤖 **Available Commands:**\n\n• **"Show fleet status"** - Get current fleet overview\n• **"Send alert to [driver]"** - Send alerts to drivers\n• **"Performance report"** - Get performance analytics\n• **"Driver details [name]"** - Get specific driver info\n• **"Sync with Uber"** - Sync latest data\n• **"Export data"** - Export fleet information\n\nTry any of these commands!`,
        type: 'command'
      }
    }
    
    return {
      content: `I understand you're asking about "${input}". I'm here to help manage your fleet operations. You can ask me about:\n\n• Fleet status and monitoring\n• Driver performance\n• Sending alerts\n• Data synchronization\n• Reports and analytics\n\nWhat would you like to know?`
    }
  }

  const quickActions = [
    { label: 'Fleet Status', icon: Activity, command: 'Show fleet status' },
    { label: 'Send Alert', icon: AlertTriangle, command: 'Send alert to driver' },
    { label: 'Performance', icon: Zap, command: 'Performance report' },
    { label: 'Sync Data', icon: Shield, command: 'Sync with Uber' }
  ]

  const handleQuickAction = (command: string) => {
    setInputValue(command)
    handleSendMessage()
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Fleet Command Center</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">AI-Powered Fleet Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Online
            </Badge>
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
                    className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'ai' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <Card className={`max-w-[80%] ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}>
                      <CardContent className="p-3">
                        <div className="whitespace-pre-wrap text-sm">
                          {message.content}
                        </div>
                        <div className={`text-xs mt-2 ${
                          message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </CardContent>
                    </Card>

                    {message.sender === 'user' && (
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-slate-600 text-white">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
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
                        <span className="text-sm text-slate-500">Fleet Commander is typing...</span>
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
            <div className="max-w-4xl mx-auto flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask your Fleet Commander anything..."
                className="flex-1"
                disabled={isTyping}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Fleet Overview</h3>
          
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Live Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{fleetStatus.avgPerformance}%</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Average Score</div>
                </div>
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
                  • 3 new alerts processed
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  • Performance report generated
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
