import { useState, useEffect, useRef } from 'react'
import { Store, ExerciseRecord, ExerciseType, CHART_COLORS, formatDate, todayStr, getDateRange, EXERCISE_LABELS } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import Chart from 'chart.js/auto'
import { Plus, Trash2, Flame, Clock } from 'lucide-react'

interface ExercisePageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function ExercisePage({ showToast }: ExercisePageProps) {
  const [records, setRecords] = useState<ExerciseRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(todayStr())
  const [formType, setFormType] = useState<ExerciseType>('running')
  const [formDuration, setFormDuration] = useState('')
  const [formCalories, setFormCalories] = useState('')
  const [formNote, setFormNote] = useState('')

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartInst = useRef<Chart | null>(null)

  const loadData = () => {
    setRecords(Store.getRecords<ExerciseRecord>('exerciseRecords'))
  }

  useEffect(() => { loadData() }, [])

  // Calorie bar chart
  useEffect(() => {
    if (!chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()

    const days = getDateRange(14)
    const dayLabels = days.map((d) => formatDate(d))
    const data = days.map((d) =>
      records.filter((r) => r.date === d).reduce((s, r) => s + r.calories, 0)
    )

    const ctx = chartRef.current.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)')
    gradient.addColorStop(1, 'rgba(239, 68, 68, 0.05)')

    chartInst.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: dayLabels,
        datasets: [{
          label: '消耗热量',
          data,
          backgroundColor: data.map((v) =>
            v > 0 ? CHART_COLORS.exercise : 'rgba(239, 68, 68, 0.1)'
          ),
          borderRadius: 8,
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
          x: { grid: { display: false }, ticks: { maxTicksLimit: 7, font: { size: 10 } } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: (v) => v + ' kcal', font: { size: 10 } } },
        },
      },
    })

    return () => { chartInst.current?.destroy() }
  }, [records])

  // Pie chart for exercise type distribution
  useEffect(() => {
    if (!pieChartRef.current) return
    if (pieChartInst.current) pieChartInst.current.destroy()

    const typeMap = new Map<ExerciseType, number>()
    records.forEach((r) => {
      typeMap.set(r.type, (typeMap.get(r.type) || 0) + r.duration)
    })

    if (typeMap.size === 0) return

    const entries = Array.from(typeMap.entries())
    const colors = ['#EF4444', '#F97316', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#84CC16', '#6B7280']

    const ctx = pieChartRef.current.getContext('2d')!

    pieChartInst.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: entries.map(([t]) => EXERCISE_LABELS[t]),
        datasets: [{
          data: entries.map(([, d]) => d),
          backgroundColor: colors.slice(0, entries.length),
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15, font: { size: 10 } } },
        },
      },
    })

    return () => { pieChartInst.current?.destroy() }
  }, [records])

  const handleSave = () => {
    const duration = parseInt(formDuration)
    const calories = parseInt(formCalories)
    if (!formDate || isNaN(duration) || duration <= 0) {
      showToast('请填写必要的运动信息', 'error')
      return
    }
    Store.addRecord<ExerciseRecord>('exerciseRecords', {
      date: formDate,
      type: formType,
      duration,
      calories: isNaN(calories) ? 0 : calories,
      note: formNote,
    } as ExerciseRecord)
    setShowForm(false)
    resetForm()
    loadData()
    showToast('运动记录已添加')
  }

  const handleDelete = (id: string) => {
    Store.deleteRecord('exerciseRecords', id)
    loadData()
    showToast('记录已删除')
  }

  const resetForm = () => {
    setFormDate(todayStr())
    setFormType('running')
    setFormDuration('')
    setFormCalories('')
    setFormNote('')
  }

  const todayRecords = records.filter((r) => r.date === todayStr())
  const todayBurned = todayRecords.reduce((s, r) => s + r.calories, 0)
  const todayDuration = todayRecords.reduce((s, r) => s + r.duration, 0)
  const totalBurned = records.reduce((s, r) => s + r.calories, 0)
  const totalDuration = records.reduce((s, r) => s + r.duration, 0)

  return (
    <div className="space-y-5">
      {/* 今日摘要 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">今日消耗</div>
            <div className="text-2xl font-bold text-exercise">{todayBurned}</div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">今日运动</div>
            <div className="text-2xl font-bold text-exercise">{todayDuration}</div>
            <div className="text-xs text-muted-foreground">分钟</div>
          </CardContent>
        </Card>
      </div>

      {/* 运动类型分布 */}
      {records.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">运动类型分布 (时长)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <canvas ref={pieChartRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 热量消耗趋势 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">消耗趋势 (14天)</CardTitle>
            <Button size="sm" variant="exercise" onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-1" />记录
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="h-64">
              <canvas ref={chartRef} />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Flame className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无运动记录</p>
              <p className="text-xs mt-1">记录你的每次运动吧</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 汇总 */}
      {records.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">累计消耗</div>
              <div className="text-lg font-bold text-exercise">{totalBurned} kcal</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">累计时长</div>
              <div className="text-lg font-bold text-exercise">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 记录列表 */}
      {records.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">最近记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[...records].reverse().slice(0, 30).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent/50 group transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-exercise-light text-exercise flex-shrink-0">
                    {EXERCISE_LABELS[r.type]}
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">{r.date}</div>
                    {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{r.duration}分钟</span>
                  {r.calories > 0 && <span className="font-semibold text-sm text-exercise">{r.calories} kcal</span>}
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal
          title="新增运动记录"
          onClose={() => { setShowForm(false); resetForm() }}
          onSubmit={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">日期</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-exercise/30" />
            </div>
            <div>
              <label className="text-sm font-medium">运动类型</label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {(Object.entries(EXERCISE_LABELS) as [ExerciseType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormType(key)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      formType === key
                        ? 'bg-exercise text-exercise-foreground'
                        : 'bg-muted hover:bg-accent'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />时长 (分钟)
                </label>
                <input type="number" value={formDuration} onChange={(e) => setFormDuration(e.target.value)}
                  placeholder="例: 30" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-exercise/30" />
              </div>
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />消耗 (kcal)
                </label>
                <input type="number" value={formCalories} onChange={(e) => setFormCalories(e.target.value)}
                  placeholder="可选" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-exercise/30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)}
                placeholder="可选" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-exercise/30" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
