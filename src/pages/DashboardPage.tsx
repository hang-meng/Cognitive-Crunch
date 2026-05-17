import { useEffect, useRef, useMemo, useState } from 'react'
import { Store, CHART_COLORS, todayStr, formatDate, getDateRange } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Chart from 'chart.js/auto'
import {
  Scale, Utensils, Dumbbell, BookOpen,
  TrendingDown, TrendingUp, Minus, Flame, Clock, Droplets, Plus, Moon, Star,
} from 'lucide-react'

interface DashboardPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function DashboardPage({ showToast }: DashboardPageProps) {
  const weightChartRef = useRef<HTMLCanvasElement>(null)
  const weightChartInst = useRef<Chart | null>(null)
  const studyChartRef = useRef<HTMLCanvasElement>(null)
  const studyChartInst = useRef<Chart | null>(null)

  const stats = useMemo(() => Store.getStats(), [])
  const today = todayStr()
  const streak = useMemo(() => Store.getStreak(), [])
  const data = useMemo(() => Store.load(), []); const profile = data.userProfile
  const calorieProgress = profile.dailyCalorieTarget ? Math.min(100, Math.round((stats.todayCalories / profile.dailyCalorieTarget) * 100)) : 0
  const studyProgress = profile.dailyStudyTarget ? Math.min(100, Math.round((stats.todayStudy / profile.dailyStudyTarget) * 100)) : 0

  // 饮水追踪本地状态（即时反馈）
  const waterTarget = profile.dailyWaterTarget ?? 2000
  const [waterAmount, setWaterAmount] = useState(stats.todayWater)
  const waterProgress = Math.min(100, Math.round((waterAmount / waterTarget) * 100))

  const handleAddWater = (amount: number) => {
    Store.addWater(amount)
    const updated = waterAmount + amount
    setWaterAmount(updated)
    showToast(`+${amount}ml 饮水已记录`)
  }

  // 睡眠状态
  const lastSleep = useMemo(() => Store.getLastSleep(), [])
  const weekSleepAvg = useMemo(() => Store.getWeeklySleepAvg(), [])
  const [showSleepForm, setShowSleepForm] = useState(false)
  const [sleepBedTime, setSleepBedTime] = useState('23:00')
  const [sleepWakeTime, setSleepWakeTime] = useState('07:00')
  const [sleepQuality, setSleepQuality] = useState(3)
  const [localSleep, setLocalSleep] = useState(lastSleep)

  const handleSaveSleep = () => {
    const record = Store.addRecord<import('@/lib/store').SleepRecord>('sleepRecords', {
      date: todayStr(),
      bedTime: sleepBedTime,
      wakeTime: sleepWakeTime,
      quality: sleepQuality,
      note: '',
    } as Omit<import('@/lib/store').SleepRecord, 'id'>)
    const duration = Store.getSleepDuration(sleepBedTime, sleepWakeTime)
    setLocalSleep({ record, duration })
    setShowSleepForm(false)
    showToast(`睡眠 ${duration}h 已记录`)
  }

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
      {/* Streak */}
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

      {/* 饮水追踪 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-water-light flex items-center justify-center">
                <Droplets className="w-4 h-4 text-water" />
              </div>
              <div>
                <span className="text-sm font-medium">今日饮水</span>
                <span className="text-xs text-muted-foreground ml-1">{waterAmount} / {waterTarget} ml</span>
              </div>
            </div>
            <span className="text-xs font-bold text-water">{waterProgress}%</span>
          </div>
          {/* 进度条 */}
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-water transition-all duration-300"
              style={{ width: `${waterProgress}%` }}
            />
          </div>
          {/* 快捷按钮 */}
          <div className="flex gap-2">
            {[200, 300, 500].map((ml) => (
              <button
                key={ml}
                onClick={() => handleAddWater(ml)}
                className="flex-1 py-2 rounded-lg bg-water-light hover:bg-water/20 text-water text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />{ml}ml
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 睡眠记录 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sleep-light flex items-center justify-center">
                <Moon className="w-4 h-4 text-sleep" />
              </div>
              <span className="text-sm font-medium">睡眠记录</span>
            </div>
            {!showSleepForm && (
              <button
                onClick={() => setShowSleepForm(true)}
                className="text-xs px-2.5 py-1 rounded-lg bg-sleep-light text-sleep hover:bg-sleep/20 transition-colors"
              >
                <Plus className="w-3 h-3 inline mr-0.5" />记录
              </button>
            )}
          </div>

          {showSleepForm ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">入睡时间</label>
                  <input
                    type="time" value={sleepBedTime}
                    onChange={(e) => setSleepBedTime(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sleep/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">起床时间</label>
                  <input
                    type="time" value={sleepWakeTime}
                    onChange={(e) => setSleepWakeTime(e.target.value)}
                    className="w-full mt-1 px-2 py-1.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sleep/20"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">睡眠质量</label>
                <div className="flex gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((q) => (
                    <button
                      key={q}
                      onClick={() => setSleepQuality(q)}
                      className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${
                        sleepQuality >= q ? 'bg-sleep text-white' : 'bg-muted hover:bg-accent'
                      }`}
                    >
                      {q === 1 ? '😫' : q === 2 ? '😕' : q === 3 ? '😐' : q === 4 ? '😊' : '😄'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSleepForm(false)}
                  className="flex-1 py-2 rounded-lg bg-muted hover:bg-accent text-sm transition-colors"
                >取消</button>
                <button
                  onClick={handleSaveSleep}
                  className="flex-1 py-2 rounded-lg bg-sleep text-white text-sm hover:bg-sleep/90 transition-colors"
                >保存</button>
              </div>
            </div>
          ) : localSleep ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {localSleep.record.bedTime} → {localSleep.record.wakeTime}
                </span>
                <span className="text-xs">{['', '😫','😕','😐','😊','😄'][localSleep.record.quality]}</span>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-2xl font-bold text-sleep">{localSleep.duration}</span>
                  <span className="text-xs text-muted-foreground ml-1">小时</span>
                </div>
                {weekSleepAvg !== null && (
                  <div className="text-xs text-muted-foreground">
                    本周平均 <span className="font-medium text-sleep">{weekSleepAvg}h</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-3 text-xs text-muted-foreground">
              还没记录睡眠，点击上方按钮开始
            </div>
          )}
        </CardContent>
      </Card>

      {/* 体重迷你图 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="w-4 h-4 text-fitness" />
            近期体重趋势 (30天)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.latestWeight === null ? (
            <div className="text-center py-8 text-muted-foreground">
              <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无体重数据</p>
              <p className="text-xs mt-1">去体重页面添加记录吧</p>
            </div>
          ) : (
            <div className="h-40">
              <canvas ref={weightChartRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* 本周学习柱状图 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-study" />
            本周每日学习时长
            {stats.weekStudy > 0 && (
              <span className="text-xs font-normal text-muted-foreground ml-auto">
                共 {Math.floor(stats.weekStudy / 60)}h {stats.weekStudy % 60}m
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40"><canvas ref={studyChartRef} /></div>
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
