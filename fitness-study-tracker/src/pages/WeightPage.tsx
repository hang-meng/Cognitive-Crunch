import { useState, useEffect, useRef } from 'react'
import { Store, WeightRecord, MeasurementRecord, CHART_COLORS, formatDate, todayStr, getDateRange, generateId, getBMICategory } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import Chart from 'chart.js/auto'
import { Plus, Trash2, ChevronDown, ChevronUp, Ruler } from 'lucide-react'

interface WeightPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function WeightPage({ showToast }: WeightPageProps) {
  const [records, setRecords] = useState<WeightRecord[]>([])
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showMeasureForm, setShowMeasureForm] = useState(false)
  const [showMeasurements, setShowMeasurements] = useState(false)
  const [formDate, setFormDate] = useState(todayStr())
  const [formWeight, setFormWeight] = useState('')
  const [formNote, setFormNote] = useState('')
  const [mDate, setMDate] = useState(todayStr())
  const [mWaist, setMWaist] = useState('')
  const [mHip, setMHip] = useState('')
  const [mChest, setMChest] = useState('')
  const [mArm, setMArm] = useState('')
  const [mThigh, setMThigh] = useState('')
  const [mNote, setMNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<Chart | null>(null)
  const measureChartRef = useRef<HTMLCanvasElement>(null)
  const measureChartInst = useRef<Chart | null>(null)

  const appData = Store.load()
  const targetWeight = appData.userProfile.targetWeight || null

  const loadData = () => {
    setRecords(Store.getRecords<WeightRecord>('weightRecords'))
    setMeasurements(Store.getRecords<MeasurementRecord>('measurementRecords'))
  }
  useEffect(() => { loadData() }, [])

  // Weight chart
  useEffect(() => {
    if (!chartRef.current) return
    if (chartInst.current) chartInst.current.destroy()
    const ctx = chartRef.current.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 300)
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)')
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)')

    const datasets: any[] = [{
      label: '体重', data: records.map((r) => r.weight),
      borderColor: CHART_COLORS.fitness, backgroundColor: gradient,
      fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6,
      pointBackgroundColor: CHART_COLORS.fitness, pointBorderColor: '#fff',
      pointBorderWidth: 2, borderWidth: 2.5,
    }]
    if (targetWeight) {
      datasets.push({
        label: '目标', data: records.map(() => targetWeight),
        borderColor: 'rgba(239,68,68,0.55)', borderDash: [8, 4],
        borderWidth: 2, pointRadius: 0, fill: false, tension: 0,
      })
    }
    chartInst.current = new Chart(ctx, {
      type: 'line',
      data: { labels: records.map((r) => formatDate(r.date)), datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: !!targetWeight, position: 'top', labels: { boxWidth: 12, font: { size: 10 } } }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.parsed.y} kg` } } },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 11 } } }, y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 }, callback: (v: any) => `${v} kg` } } },
        interaction: { intersect: false, mode: 'index' },
      },
    })
    return () => { chartInst.current?.destroy() }
  }, [records, targetWeight])

  // Measure chart
  useEffect(() => {
    if (!measureChartRef.current || !showMeasurements) return
    if (measureChartInst.current) measureChartInst.current.destroy()
    if (measurements.length === 0) return
    const ctx = measureChartRef.current.getContext('2d')!
    const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
    measureChartInst.current = new Chart(ctx, {
      type: 'line',
      data: { labels: measurements.map((m) => formatDate(m.date)), datasets: [
        { label: '腰围', data: measurements.map((m) => m.waist), borderColor: colors[0], tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: '臀围', data: measurements.map((m) => m.hip), borderColor: colors[1], tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: '胸围', data: measurements.map((m) => m.chest), borderColor: colors[2], tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: '臂围', data: measurements.map((m) => m.arm), borderColor: colors[3], tension: 0.4, borderWidth: 2, pointRadius: 3 },
        { label: '大腿围', data: measurements.map((m) => m.thigh), borderColor: colors[4], tension: 0.4, borderWidth: 2, pointRadius: 3 },
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 10 } } } },
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 8, font: { size: 10 } } }, y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { callback: (v: any) => `${v} cm`, font: { size: 10 } } } },
      },
    })
    return () => { measureChartInst.current?.destroy() }
  }, [measurements, showMeasurements])

  const handleSave = () => {
    const w = parseFloat(formWeight)
    if (!formDate || isNaN(w) || w <= 0) { showToast('请输入有效日期和体重', 'error'); return }
    if (editingId) { Store.updateRecord<WeightRecord>('weightRecords', editingId, { date: formDate, weight: w, note: formNote }); showToast('记录已更新') }
    else { Store.addRecord<WeightRecord>('weightRecords', { date: formDate, weight: w, note: formNote } as WeightRecord); showToast('体重记录已添加') }
    setShowForm(false); resetForm(); loadData()
  }

  const handleSaveMeasure = () => {
    const w = parseFloat(mWaist)
    if (!mDate || isNaN(w) || w <= 0) { showToast('请至少填写日期和腰围', 'error'); return }
    Store.addRecord<MeasurementRecord>('measurementRecords', { date: mDate, waist: w, hip: parseFloat(mHip) || 0, chest: parseFloat(mChest) || 0, arm: parseFloat(mArm) || 0, thigh: parseFloat(mThigh) || 0, note: mNote } as MeasurementRecord)
    setShowMeasureForm(false); resetMeasureForm(); loadData(); showToast('围度记录已添加')
  }

  const handleDelete = (id: string) => { Store.deleteRecord('weightRecords', id); loadData(); showToast('记录已删除') }
  const handleDeleteMeasure = (id: string) => { Store.deleteRecord('measurementRecords', id); loadData(); showToast('围度记录已删除') }
  const handleEdit = (r: WeightRecord) => { setEditingId(r.id); setFormDate(r.date); setFormWeight(r.weight.toString()); setFormNote(r.note); setShowForm(true) }
  const resetForm = () => { setFormDate(todayStr()); setFormWeight(''); setFormNote(''); setEditingId(null) }
  const resetMeasureForm = () => { setMDate(todayStr()); setMWaist(''); setMHip(''); setMChest(''); setMArm(''); setMThigh(''); setMNote('') }

  const latestWeight = records.length > 0 ? records[records.length - 1].weight : null
  const firstWeight = records.length > 0 ? records[0].weight : null
  const weightDiff = latestWeight && firstWeight ? (latestWeight - firstWeight).toFixed(1) : null
  const bmi = latestWeight && appData.userProfile.height ? +(latestWeight / ((appData.userProfile.height / 100) ** 2)).toFixed(1) : null
  const bmiCat = bmi ? getBMICategory(bmi) : null
  const targetToGo = targetWeight && latestWeight ? +(latestWeight - targetWeight).toFixed(1) : null

  return (
    <div className="space-y-5">
      {latestWeight && (
        <div className="grid grid-cols-2 gap-3">
          <Card><CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">最新体重</div>
            <div className="text-xl font-bold text-fitness">{latestWeight}<span className="text-sm font-normal">kg</span></div>
            {targetToGo !== null && <div className="text-xs mt-1 text-muted-foreground">距目标 {targetToGo > 0 ? `还差 ${targetToGo}` : `已超 ${Math.abs(targetToGo)}`} kg</div>}
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">BMI</div>
            <div className="text-xl font-bold text-study">{bmi || '-'}</div>
            {bmiCat && <div className={`text-xs mt-1 ${bmiCat.textColor}`}>{bmiCat.label}</div>}
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">累计变化</div>
            <div className={`text-xl font-bold ${Number(weightDiff) < 0 ? 'text-fitness' : Number(weightDiff) > 0 ? 'text-exercise' : 'text-muted-foreground'}`}>
              {Number(weightDiff) > 0 ? '+' : ''}{weightDiff}<span className="text-sm font-normal">kg</span></div>
          </CardContent></Card>
          {targetWeight && <Card><CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">目标体重</div>
            <div className="text-xl font-bold text-exercise">{targetWeight}<span className="text-sm font-normal">kg</span></div>
          </CardContent></Card>}
        </div>
      )}

      <Card>
        <CardHeader className="pb-2"><div className="flex items-center justify-between">
          <CardTitle className="text-sm">体重趋势</CardTitle>
          <Button size="sm" variant="fitness" onClick={() => { resetForm(); setShowForm(true) }}><Plus className="w-4 h-4 mr-1" />记录</Button>
        </div></CardHeader>
        <CardContent>
          {records.length > 0 ? <div className="h-72"><canvas ref={chartRef} /></div>
            : <div className="text-center py-12 text-muted-foreground"><p className="text-sm">暂无体重记录</p><p className="text-xs mt-1">点击"记录"添加你的第一条体重数据</p></div>}
        </CardContent>
      </Card>

      {records.length > 0 && (
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">记录列表</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {[...records].reverse().slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group" onClick={() => handleEdit(r)}>
                <div><div className="text-sm">{r.date}</div>{r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}</div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-fitness">{r.weight} kg</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(r.id) }} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </CardContent></Card>
      )}

      <Card>
        <CardHeader className="pb-2"><div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-sm font-semibold" onClick={() => setShowMeasurements(!showMeasurements)}>
            <Ruler className="w-4 h-4 text-fitness" />围度测量{showMeasurements ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <Button size="sm" variant="outline" onClick={() => { resetMeasureForm(); setShowMeasureForm(true) }}><Plus className="w-4 h-4 mr-1" />添加</Button>
        </div></CardHeader>
        {showMeasurements && <CardContent>
          {measurements.length > 0 ? (<>
            <div className="h-64 mb-3"><canvas ref={measureChartRef} /></div>
            <div className="space-y-1">{[...measurements].reverse().map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent/50 text-xs">
                <span>{m.date}</span>
                <div className="flex gap-3 text-muted-foreground">{m.waist > 0 && <span>腰{m.waist}</span>}{m.hip > 0 && <span>臀{m.hip}</span>}{m.chest > 0 && <span>胸{m.chest}</span>}{m.arm > 0 && <span>臂{m.arm}</span>}{m.thigh > 0 && <span>腿{m.thigh}</span>}</div>
                <button onClick={() => handleDeleteMeasure(m.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
              </div>
            ))}</div>
          </>) : <div className="text-center py-6 text-sm text-muted-foreground">暂无围度数据</div>}
        </CardContent>}
      </Card>

      {showForm && <Modal title={editingId ? '编辑体重记录' : '新增体重记录'} onClose={() => { setShowForm(false); resetForm() }} onSubmit={handleSave}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium">日期</label><input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
          <div><label className="text-sm font-medium">体重 (kg)</label><input type="number" value={formWeight} onChange={(e) => setFormWeight(e.target.value)} placeholder="例: 70.5" step="0.1" min="20" max="300" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
          <div><label className="text-sm font-medium">备注</label><input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="可选备注" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
        </div>
      </Modal>}

      {showMeasureForm && <Modal title="新增围度记录" onClose={() => { setShowMeasureForm(false); resetMeasureForm() }} onSubmit={handleSaveMeasure}>
        <div className="space-y-4">
          <div><label className="text-sm font-medium">日期</label><input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">腰围 (cm)</label><input type="number" value={mWaist} onChange={(e) => setMWaist(e.target.value)} placeholder="必填" step="0.1" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
            <div><label className="text-sm font-medium">臀围 (cm)</label><input type="number" value={mHip} onChange={(e) => setMHip(e.target.value)} placeholder="选填" step="0.1" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
            <div><label className="text-sm font-medium">胸围 (cm)</label><input type="number" value={mChest} onChange={(e) => setMChest(e.target.value)} placeholder="选填" step="0.1" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
            <div><label className="text-sm font-medium">臂围 (cm)</label><input type="number" value={mArm} onChange={(e) => setMArm(e.target.value)} placeholder="选填" step="0.1" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
            <div><label className="text-sm font-medium">大腿围 (cm)</label><input type="number" value={mThigh} onChange={(e) => setMThigh(e.target.value)} placeholder="选填" step="0.1" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
          </div>
          <div><label className="text-sm font-medium">备注</label><input type="text" value={mNote} onChange={(e) => setMNote(e.target.value)} placeholder="可选" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/30" /></div>
        </div>
      </Modal>}
    </div>
  )
}
