import { useState, useEffect, useRef } from 'react'
import { Store, DietRecord, CHART_COLORS, formatDate, todayStr, getDateRange, MEAL_LABELS } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import Chart from 'chart.js/auto'
import { Plus, Trash2, Flame, Egg, Wheat, Droplets } from 'lucide-react'
import { FoodSearch } from '@/components/FoodSearch'

interface DietPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function DietPage({ showToast }: DietPageProps) {
  const [records, setRecords] = useState<DietRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(todayStr())
  const [formMealType, setFormMealType] = useState<DietRecord['mealType']>('lunch')
  const [formFoodName, setFormFoodName] = useState('')
  const [formCalories, setFormCalories] = useState('')
  const [formProtein, setFormProtein] = useState('')
  const [formCarbs, setFormCarbs] = useState('')
  const [formFat, setFormFat] = useState('')
  const [formNote, setFormNote] = useState('')

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)
  const pieChartRef = useRef<HTMLCanvasElement>(null)
  const pieChartInst = useRef<Chart | null>(null)

  const loadData = () => {
    setRecords(Store.getRecords<DietRecord>('dietRecords'))
  }

  useEffect(() => { loadData() }, [])

  // Calorie bar chart
  useEffect(() => {
    if (!chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()

    const days = getDateRange(14)
    const dayLabels = days.map((d) => formatDate(d))
    const mealTypes: DietRecord['mealType'][] = ['breakfast', 'lunch', 'dinner', 'snack']
    const mealColors = ['#FCD34D', '#F59E0B', '#D97706', '#FBBF24']

    const datasets = mealTypes.map((mt, i) => ({
      label: MEAL_LABELS[mt],
      data: days.map((d) =>
        records.filter((r) => r.date === d && r.mealType === mt).reduce((s, r) => s + r.calories, 0)
      ),
      backgroundColor: mealColors[i],
      borderRadius: 4,
      borderSkipped: false,
    }))

    const ctx = chartRef.current.getContext('2d')!

    chartInst.current = new Chart(ctx, {
      type: 'bar',
      data: { labels: dayLabels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10 } } },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: { maxTicksLimit: 7, font: { size: 10 } },
          },
          y: {
            stacked: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { callback: (v) => v + ' kcal', font: { size: 10 } },
          },
        },
      },
    })

    return () => { chartInst.current?.destroy() }
  }, [records])

  // Nutrition doughnut chart
  useEffect(() => {
    if (!pieChartRef.current) return
    if (pieChartInst.current) pieChartInst.current.destroy()

    const today = todayStr()
    const todayRecords = records.filter((r) => r.date === today)
    const totalProtein = todayRecords.reduce((s, r) => s + (r.protein || 0), 0)
    const totalCarbs = todayRecords.reduce((s, r) => s + (r.carbs || 0), 0)
    const totalFat = todayRecords.reduce((s, r) => s + (r.fat || 0), 0)

    if (totalProtein + totalCarbs + totalFat === 0) return

    const ctx = pieChartRef.current.getContext('2d')!

    pieChartInst.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['蛋白质', '碳水', '脂肪'],
        datasets: [{
          data: [totalProtein, totalCarbs, totalFat],
          backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6'],
          borderWidth: 2,
          borderColor: '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { padding: 15, font: { size: 10 } } },
        },
      },
    })

    return () => { pieChartInst.current?.destroy() }
  }, [records])

  const handleSave = () => {
    const calories = parseInt(formCalories)
    if (!formDate || !formFoodName || isNaN(calories) || calories <= 0) {
      showToast('请填写必要的饮食信息', 'error')
      return
    }
    Store.addRecord<DietRecord>('dietRecords', {
      date: formDate,
      mealType: formMealType,
      foodName: formFoodName,
      calories,
      protein: parseInt(formProtein) || 0,
      carbs: parseInt(formCarbs) || 0,
      fat: parseInt(formFat) || 0,
      note: formNote,
    } as DietRecord)
    setShowForm(false)
    resetForm()
    loadData()
    showToast('饮食记录已添加')
  }

  const handleDelete = (id: string) => {
    Store.deleteRecord('dietRecords', id)
    loadData()
    showToast('记录已删除')
  }

  const resetForm = () => {
    setFormDate(todayStr())
    setFormMealType('lunch')
    setFormFoodName('')
    setFormCalories('')
    setFormProtein('')
    setFormCarbs('')
    setFormFat('')
    setFormNote('')
  }

  const todayRecords = records.filter((r) => r.date === todayStr())
  const todayCalories = todayRecords.reduce((s, r) => s + r.calories, 0)

  return (
    <div className="space-y-5">
      {/* 今日摘要 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">今日摄入</div>
            <div className="text-2xl font-bold text-diet">{todayCalories}</div>
            <div className="text-xs text-muted-foreground">kcal</div>
          </CardContent>
        </Card>
        {todayRecords.length > 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-xs text-muted-foreground mb-1">今日记录</div>
              <div className="text-2xl font-bold text-diet">{todayRecords.length}</div>
              <div className="text-xs text-muted-foreground">条</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 今日营养比例 */}
      {todayRecords.filter((r) => r.protein > 0 || r.carbs > 0 || r.fat > 0).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">今日营养比例</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <canvas ref={pieChartRef} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 热量趋势图 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">热量摄入趋势 (14天)</CardTitle>
            <Button size="sm" variant="diet" onClick={() => { resetForm(); setShowForm(true) }}>
              <Plus className="w-4 h-4 mr-1" />记录
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="h-72">
              <canvas ref={chartRef} />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Flame className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无饮食记录</p>
              <p className="text-xs mt-1">开始记录你的每日饮食吧</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <span className="text-xs px-1.5 py-0.5 rounded bg-diet-light text-diet flex-shrink-0">
                    {MEAL_LABELS[r.mealType]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{r.foodName}</div>
                    <div className="text-xs text-muted-foreground">{r.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-semibold text-sm text-diet">{r.calories} kcal</span>
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
          title="新增饮食记录"
          onClose={() => { setShowForm(false); resetForm() }}
          onSubmit={handleSave}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">日期</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/30" />
            </div>
            <div>
              <label className="text-sm font-medium">餐别</label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mt) => (
                  <button
                    key={mt}
                    type="button"
                    onClick={() => setFormMealType(mt)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      formMealType === mt
                        ? 'bg-diet text-diet-foreground'
                        : 'bg-muted hover:bg-accent'
                    }`}
                  >
                    {MEAL_LABELS[mt]}
                  </button>
                ))}
              </div>
            </div>
            <FoodSearch onSelect={(food, quantity) => {
              setFormFoodName(food.name)
              const ratio = quantity / 100
              setFormCalories(Math.round(food.calories * ratio).toString())
              setFormProtein(Math.round(food.protein * ratio).toString())
              setFormCarbs(Math.round(food.carbs * ratio).toString())
              setFormFat(Math.round(food.fat * ratio).toString())
            }} />
            {formFoodName && (
              <div className="mt-2">
                <label className="text-sm font-medium">食物名称</label>
                <input type="text" value={formFoodName} onChange={(e) => setFormFoodName(e.target.value)}
                  placeholder="已自动填入，可修改"
                  className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/30" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">热量 (kcal)</label>
              <input type="number" value={formCalories} onChange={(e) => setFormCalories(e.target.value)}
                placeholder="例: 200" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/30" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Egg className="w-3 h-3" />蛋白质(g)
                </label>
                <input type="number" value={formProtein} onChange={(e) => setFormProtein(e.target.value)}
                  placeholder="0" className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Wheat className="w-3 h-3" />碳水(g)
                </label>
                <input type="number" value={formCarbs} onChange={(e) => setFormCarbs(e.target.value)}
                  placeholder="0" className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Droplets className="w-3 h-3" />脂肪(g)
                </label>
                <input type="number" value={formFat} onChange={(e) => setFormFat(e.target.value)}
                  placeholder="0" className="w-full mt-1 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)}
                placeholder="可选" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/30" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
