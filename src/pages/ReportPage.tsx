import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { Store, formatDate } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Chart from 'chart.js/auto'
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Minus, ArrowUp, ArrowDown } from 'lucide-react'

interface ReportPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export const ReportPage = memo(function ReportPage({ showToast }: ReportPageProps) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [monthOffset, setMonthOffset] = useState(0)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)

  // 缓存 localStorage 数据，避免每次渲染都读取
  const cachedData = useMemo(() => Store.load(), [])

  const report = viewMode === 'week'
    ? Store.getWeeklyReport()
    : Store.getMonthlyReport(monthOffset)

  // 本周 vs 上周对比（仅周报模式显示）
  const comparison = useMemo(() => {
    if (viewMode !== 'week' || weekOffset !== 0) return null
    return Store.getWeekComparison()
  }, [viewMode, weekOffset])

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()

    const data = cachedData
    const days = viewMode === 'week' ? 7 : 30
    const dates: string[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i - (viewMode === 'week' ? weekOffset * 7 : 0))
      dates.push(d.toISOString().split('T')[0])
    }

    const calIn = dates.map((d) => data.dietRecords.filter((r) => r.date === d).reduce((s, r) => s + r.calories, 0))
    const calOut = dates.map((d) => data.exerciseRecords.filter((r) => r.date === d).reduce((s, r) => s + r.calories, 0))
    const study = dates.map((d) => data.studyRecords.filter((r) => r.date === d).reduce((s, r) => s + r.duration, 0))

    const ctx = chartRef.current.getContext('2d')!

    chartInst.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dates.map((d) => {
          const dt = new Date(d + 'T00:00:00')
          return `${dt.getMonth() + 1}/${dt.getDate()}`
        }),
        datasets: [
          {
            label: '摄入(kcal)',
            data: calIn,
            backgroundColor: 'rgba(245, 158, 11, 0.6)',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: '消耗(kcal)',
            data: calOut,
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: '学习(min)',
            data: study,
            backgroundColor: 'rgba(99, 102, 241, 0.4)',
            borderRadius: 4,
            borderSkipped: false,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10 } } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10 } } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, position: 'left', title: { display: true, text: 'kcal', font: { size: 10 } } },
          y1: { grid: { display: false }, position: 'right', title: { display: true, text: 'min', font: { size: 10 } } },
        },
      },
    })

    return () => { chartInst.current?.destroy() }
  }, [viewMode, weekOffset, monthOffset])

  const subjectEntries = Object.entries(report.bySubject || {}).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-5">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'week' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
            }`}
          >周报</button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'
            }`}
          >月报</button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => viewMode === 'week' ? setWeekOffset(w => w + 1) : setMonthOffset(m => m + 1)}
            className="p-1 rounded-lg hover:bg-accent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            {report.startDate} ~ {report.endDate}
          </span>
          <button
            onClick={() => {
              if (viewMode === 'week' && weekOffset > 0) setWeekOffset(w => w - 1)
              if (viewMode === 'month' && monthOffset > 0) setMonthOffset(m => m - 1)
            }}
            className="p-1 rounded-lg hover:bg-accent"
            disabled={(viewMode === 'week' && weekOffset === 0) || (viewMode === 'month' && monthOffset === 0)}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">摄入热量</div>
            <div className="text-xl font-bold text-diet">{report.totalCaloriesIn.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">净热量差</div>
            <div className={`text-xl font-bold ${report.netCalories < 0 ? 'text-fitness' : 'text-exercise'}`}>
              {report.netCalories > 0 ? '+' : ''}{report.netCalories.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">学习时长</div>
            <div className="text-xl font-bold text-study">
              {Math.floor(report.totalStudyMin / 60)}h {report.totalStudyMin % 60}m
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground">记录天数</div>
            <div className="text-xl font-bold text-fitness">{report.recordDays}</div>
            <div className="text-xs text-muted-foreground">/{viewMode === 'week' ? 7 : 30}天</div>
          </CardContent>
        </Card>
      </div>

      {/* 本周 vs 上周对比 */}
      {comparison && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">本周 vs 上周</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: '摄入热量', unit: 'kcal', curr: comparison.thisCaloriesIn, prev: comparison.lastCaloriesIn, pct: comparison.calInPct, color: 'text-diet', downGood: true },
              { label: '运动消耗', unit: 'kcal', curr: comparison.thisCaloriesOut, prev: comparison.lastCaloriesOut, pct: comparison.calOutPct, color: 'text-exercise', downGood: false },
              { label: '学习时长', unit: 'min', curr: comparison.thisStudyMin, prev: comparison.lastStudyMin, pct: comparison.studyPct, color: 'text-study', downGood: false },
            ].map((item) => {
              const isUp = item.pct !== null && item.pct > 0
              const isDown = item.pct !== null && item.pct < 0
              const isGood = item.downGood ? isDown : isUp
              const isBad = item.downGood ? isUp : isDown
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground w-16">{item.label}</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-sm font-bold ${item.color}`}>{item.curr.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">
                        上周 {item.prev.toLocaleString()} {item.unit}
                      </div>
                    </div>
                    {item.pct !== null && (
                      <div className={`flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded ${
                        isGood ? 'text-fitness bg-fitness/10' : isBad ? 'text-exercise bg-exercise/10' : 'text-muted-foreground bg-muted'
                      }`}>
                        {isUp ? <ArrowUp className="w-3 h-3" /> : isDown ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {Math.abs(item.pct)}%
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Weight change */}
      {report.weightStart && report.weightEnd && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">体重变化</div>
              <div className="text-sm">
                {report.weightStart} → {report.weightEnd} kg
                {report.weightChange !== null && (
                  <span className={`ml-2 font-bold ${report.weightChange < 0 ? 'text-fitness' : report.weightChange > 0 ? 'text-exercise' : 'text-muted-foreground'}`}>
                    {report.weightChange > 0 ? '+' : ''}{report.weightChange}
                  </span>
                )}
              </div>
            </div>
            {report.weightChange !== null && (
              report.weightChange < 0
                ? <TrendingDown className="w-5 h-5 text-fitness" />
                : report.weightChange > 0
                  ? <TrendingUp className="w-5 h-5 text-exercise" />
                  : <Minus className="w-5 h-5 text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      )}

      {/* Subject breakdown */}
      {subjectEntries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">科目学习分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {subjectEntries.map(([subject, minutes]) => (
              <div key={subject} className="flex items-center justify-between text-sm">
                <span>{subject}</span>
                <span className="font-medium text-study">
                  {Math.floor(minutes / 60) > 0 ? `${Math.floor(minutes / 60)}h ` : ''}{minutes % 60}m
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Best exam */}
      {(report as ReturnType<typeof Store.getMonthlyReport>).bestExam && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">最佳成绩</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm">{(report as ReturnType<typeof Store.getMonthlyReport>).bestExam!.subject}</div>
                <div className="text-xs text-muted-foreground">{(report as ReturnType<typeof Store.getMonthlyReport>).bestExam!.name}</div>
              </div>
              <div className="text-lg font-bold text-study">
                {(report as ReturnType<typeof Store.getMonthlyReport>).bestExam!.score}/
                {(report as ReturnType<typeof Store.getMonthlyReport>).bestExam!.total}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">每日概览</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <canvas ref={chartRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
})
