import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export interface ToastMessage {
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
}

export function Toast({ message, type }: ToastProps) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-fitness" />,
    error: <AlertCircle className="w-5 h-5 text-destructive" />,
    info: <Info className="w-5 h-5 text-study" />,
  }

  const bgColors = {
    success: 'border-fitness/20 bg-fitness/5',
    error: 'border-destructive/20 bg-destructive/5',
    info: 'border-study/20 bg-study/5',
  }

  return (
    <div
      className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-up ${bgColors[type]}`}
    >
      {icons[type]}
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
