"use client"

import { useToast } from './use-toast'
import { CheckCircle, AlertTriangle, X } from 'lucide-react'

export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm sm:max-w-md">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            w-full p-4 rounded-lg shadow-lg border backdrop-blur-sm
            transition-all duration-300 ease-in-out transform
            animate-in slide-in-from-right-full
            ${toast.variant === 'destructive' 
              ? 'bg-red-50/95 border-red-200 text-red-900' 
              : 'bg-green-50/95 border-green-200 text-green-900'
            }
          `}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {toast.variant === 'destructive' ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="font-semibold text-sm mb-1 pr-2">
                  {toast.title}
                </div>
              )}
              {toast.description && (
                <div className="text-sm opacity-90 pr-2 break-words">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="flex-shrink-0 ml-2 opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
} 