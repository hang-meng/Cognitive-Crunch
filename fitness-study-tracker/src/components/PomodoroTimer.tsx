import { useState, useEffect, useRef, useCallback } from 'react'
import { StudySubject } from '@/lib/store'
import { Play, Pause, RotateCcw, CheckCircle } from 'lucide-react'

interface PomodoroTimerProps {
  onComplete: (durationMinutes: number) => void
}

export function PomodoroTimer({ onComplete }: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes default
  const [preset, setPreset] = useState(25)
  const [showConfirm, setShowConfirm] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const presets = [15, 25, 30, 45, 60, 90]

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            setShowConfirm(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, timeLeft])

  const startPause = () => {
    if (timeLeft === 0) {
      setTimeLeft(preset * 60)
    }
    setIsRunning(!isRunning)
  }

  const reset = () => {
    setIsRunning(false)
    setTimeLeft(preset * 60)
    setShowConfirm(false)
  }

  const confirmRecord = () => {
    onComplete(preset)
    reset()
  }

  const selectPreset = (min: number) => {
    if (isRunning) return
    setPreset(min)
    setTimeLeft(min * 60)
  }

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = preset > 0 ? 1 - timeLeft / (preset * 60) : 0

  return (
    <div className="text-center space-y-4">
      {/* Preset selector */}
      {!isRunning && !showConfirm && (
        <div className="flex justify-center gap-2 flex-wrap">
          {presets.map((min) => (
            <button
              key={min}
              type="button"
              onClick={() => selectPreset(min)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                preset === min
                  ? 'bg-study text-study-foreground'
                  : 'bg-muted hover:bg-accent'
              }`}
            >
              {min}分钟
            </button>
          ))}
        </div>
      )}

      {/* Timer display */}
      <div className="relative w-40 h-40 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor"
            className="text-muted" strokeWidth="6" opacity="0.2" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor"
            className="text-study" strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${progress * 283} 283`}
            style={{ transition: 'stroke-dasharray 1s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showConfirm ? (
            <div className="space-y-2">
              <CheckCircle className="w-10 h-10 text-fitness mx-auto" />
              <span className="text-xs text-muted-foreground">时间到!</span>
              <button
                onClick={confirmRecord}
                className="px-3 py-1.5 bg-fitness text-white text-xs rounded-lg hover:bg-fitness/90 transition-colors"
              >
                记录 {preset} 分钟
              </button>
              <button onClick={reset} className="block mx-auto text-xs text-muted-foreground hover:text-foreground">
                忽略
              </button>
            </div>
          ) : (
            <>
              <span className="text-3xl font-bold text-study tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                {isRunning ? '专注中...' : `${preset} 分钟`}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Controls */}
      {!showConfirm && (
        <div className="flex justify-center gap-3">
          <button
            onClick={startPause}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isRunning ? 'bg-diet/10 text-diet hover:bg-diet/20' : 'bg-study text-white hover:bg-study/90'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>
          <button
            onClick={reset}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-muted hover:bg-accent transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
