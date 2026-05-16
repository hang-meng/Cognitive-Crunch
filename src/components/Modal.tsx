import { useState, ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
  onSubmit: () => void
  submitLabel?: string
  submitDisabled?: boolean
}

export function Modal({ title, children, onClose, onSubmit, submitLabel = '保存', submitDisabled }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full md:max-w-md bg-card border md:rounded-2xl rounded-t-2xl shadow-xl animate-slide-up max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-5">
          {children}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 pt-0 border-t mt-0 flex-shrink-0">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button className="flex-1" onClick={onSubmit} disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
