import { useEffect, useRef } from 'react'
import { Store, CHART_COLORS, todayStr, formatDate, getDateRange } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Chart from 'chart.js/auto'
import {
  Scale, Utensils, Dumbbell, BookOpen,
  TrendingDown, TrendingUp, Minus, Flame, Clock, Target,
} from 'lucide-react'

interface DashboardPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function DashboardPage({ showToast }: DashboardPageProps) {
  const weightChartRef = useRef<HTMLCanvasElement>(null)
  const weightChartInst = useRef<Chart | null>(null)
  const studyChartRef = useRef<HTMLCanvasElement>(null)
  const studyChartInst = useRef<Chart | null>(null)

  const stats = Store.getStats()
  const today = todayStr()
  const streak = Store.getStreak()
  const data = Store.load(); const profile = data.userProfile
  const calorieProgress = profile.dailyCalorieTarget ? Math.min(100, Math.round((stats.todayCalories / profile.dailyCalorieTarget) * 100)) : 0
  const studyProgress = profile.dailyStudyTarget ? Math.min(100, Math.round((stats.todayStudy / profile.dailyStudyTarget) * 100)) : 0

  useEffect(() => {
    // Weight mini chart
    if (weightChartRef.current) {
      if (weightChartInst.current) weightChartInst.current.destroy()
      const trend = Store.getWeightTrend(30)
      const hasData = trend.some((d) => d.weight > 0)
      const ctx = weightChartRef.current.getContext('2d')!
      const gradient = ctx.createLinearGradient(0, 0, 0, 160)
      gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
      gradient.addColorStop(1, 'rgba(16, 185, 129, 0.02)')

      weightChartInst.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: trend.map((d) => formatDate(d.date)),
          datasets: [{
            label: '体重',
            data: trend.map((d) => d.weight || null),
            borderColor: CHART_COLORS.fitness,
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            pointRadius: hasData ? 2 : 0,
            pointHoverRadius: 5,
            pointBackgroundColor: CHART_COLORS.fitness,
            borderWidth: 2,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ctx.parsed.y != null && ctx.parsed.y > 0 ? `${ctx.parsed.y} kg` : '无数据',
              },
            },
          },
          scales: {
            x: { display: false },
            y: { display: false },
          },
        },
      })
    }

    // Study mini chart
    if (studyChartRef.current) {
      if (studyChartInst.current) studyChartInst.current.destroy()
      const days = getDateRange(7)
      const dayLabels = days.map((d) => {
        const date = new Date(d + 'T00:00:00')
        return ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]
      })
      const data = days.map((d) => Store.getDailyStudyMinutes(d))

      const ctx = studyChartRef.current.getContext('2d')!

      studyChartInst.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dayLabels,
          datasets: [{
            label: '学习时长',
            data,
            backgroundColor: data.map((v) =>
              v > 0 ? CHART_COLORS.study : 'rgba(99, 102, 241, 0.1)'
            ),
            borderRadius: 6,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { display: false },
          },
        },
      })
    }

    return () => {
      weightChartInst.current?.destroy()
      studyChartInst.current?.destroy()
    }
  }, [])

  const statCards = [
    {
      label: '最新体重',
      value: stats.latestWeight ? `${stats.latestWeight} kg` : '暂无数据',
      icon: Scale,
      color: 'fitness',
      bg: 'bg-fitness-light',
      textColor: 'text-fitness',
      change: stats.weightChange !== null ? (
        stats.weightChange < 0
          ? <span className="text-fitness flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> {Math.abs(stats.weightChange)} kg</span>
          : stats.weightChange > 0
            ? <span className="text-exercise flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +{stats.weightChange} kg</span>
            : <span className="text-muted-foreground flex items-center gap-0.5"><Minus className="w-3 h-3" /> 持平</span>
      ) : null,
    },
    {
      label: '今日摄入',
      value: `${stats.todayCalories} kcal`,
      icon: Utensils,
      color: 'diet',
      bg: 'bg-diet-light',
      textColor: 'text-diet',
      change: null,
    },
    {
      label: '今日消耗',
      value: `${stats.todayBurned} kcal`,
      icon: Flame,
      color: 'exercise',
      bg: 'bg-exercise-light',
      textColor: 'text-exercise',
      change: null,
    },
    {
      label: '今日学习',
      value: stats.todayStudy > 0 ? `${Math.floor(stats.todayStudy / 60)}h ${stats.todayStudy % 60}m` : '暂无记录',
      icon: Clock,
      color: 'study',
      bg: 'bg-study-light',
      textColor: 'text-study',
      change: stats.todayStudy > 0 ? <span className="text-study text-xs">{stats.todayStudy} 分钟</span> : null,
    },
  ]

  return (
    <div className="space-y-5">
      {/* Streak + Goals */}
      <div className="grid grid-cols-1 gap-3 mb-2">
        {streak > 0 && (
          <Card className="bg-gradient-to-r from-diet-light to-exercise-light">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-diet/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-diet" />
              </div>
              <div>
                <div className="text-2xl font-bold">{streak} <span className="text-base font-normal text-muted-foreground">天</span></div>
                <div className="text-xs text-muted-foreground">连续记录打卡</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.textColor}`} />
                  </div>
                </div>
                <div className={`text-lg font-bold ${card.textColor}`}>{card.value}</div>
                {card.change && <div className="mt-1 text-xs">{card.change}</div>}
                {card.label === '今日摄入' && (profile.dailyCalorieTarget ?? 0) > 0 && (
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${calorieProgress > 100 ? 'bg-exercise' : 'bg-diet'}`} style={{width: `${calorieProgress}%`}} />
                  </div>
                )}
                {card.label === '今日学习' && (profile.dailyStudyTarget ?? 0) > 0 && (
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-study transition-all" style={{width: `${studyProgress}%`}} />
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 本周学习时长 */}
      {stats.weekStudy > 0 && (
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-study" />
              本周学习总计：{Math.floor(stats.weekStudy / 60)}h {stats.weekStudy % 60}m
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      {/* 体重迷你图 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-fitness" />
            近期体重趋势 (30天)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <canvas ref={weightChartRef} />
          </div>
        </CardContent>
      </Card>

      {/* 本周学习柱状图 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-study" />
            本周每日学习时长
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40">
            <canvas ref={studyChartRef} />
          </div>
        </CardContent>
      </Card>

      {/* 最新模考 */}
      {stats.latestExam && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-study" />
              最新模考成绩
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">{stats.latestExam.examName}</div>
                <div className="text-sm">{stats.latestExam.subject}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-study">
                  {stats.latestExam.score}
                  <span className="text-sm text-muted-foreground">/{stats.latestExam.totalScore}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {((stats.latestExam.score / stats.latestExam.totalScore) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 总记录数 */}
      <div className="text-center text-xs text-muted-foreground">
        共 {stats.totalRecords} 条记录
      </div>
    </div>
  )
}
