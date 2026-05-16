import { useEffect, useState } from 'react'
import { Store, Milestone } from '@/lib/store'
import { Trophy, X } from 'lucide-react'

interface MilestoneNotificationProps {
  onClose: () => void
}

export function MilestoneNotification({ onClose }: MilestoneNotificationProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])

  useEffect(() => {
    const ms = Store.checkMilestones()
    setMilestones(ms.filter((m) => !m.seen))
  }, [])

  if (milestones.length === 0) return null

  const handleDismiss = (id: string) => {
    Store.markMilestoneSeen(id)
    setMilestones((prev) => prev.filter((m) => m.id !== id))
    if (milestones.length <= 1) onClose()
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm space-y-2 animate-slide-up">
      {milestones.map((m) => (
        <div
          key={m.id}
          className="flex items-start gap-3 p-4 rounded-xl border bg-card shadow-lg animate-scale-in"
        >
          <div className="w-10 h-10 rounded-full bg-fitness-light flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-fitness" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{m.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{m.description}</div>
          </div>
          <button onClick={() => handleDismiss(m.id)} className="flex-shrink-0 p-1 hover:bg-accent rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
