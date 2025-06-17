"use client"

import { useState, useCallback } from 'react'

export interface Toast {
  id?: string
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

let toastCounter = 0

export function useToast() {
  const [toasts, setToasts] = useState<(Toast & { id: string })[]>([])

  const toast = useCallback(({ title, description, variant = 'default' }: Toast) => {
    const id = `toast-${++toastCounter}`
    const newToast = { id, title, description, variant }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
    
    return { id }
  }, [])

  const dismiss = useCallback((toastId?: string) => {
    if (toastId) {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    } else {
      setToasts([])
    }
  }, [])

  return {
    toasts,
    toast,
    dismiss,
  }
} 