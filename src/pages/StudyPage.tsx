import { useState, useEffect, useRef } from 'react'
import { Store, StudyRecord, ExamRecord, StudySubject, CHART_COLORS, formatDate, todayStr, getDateRange } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/Modal'
import Chart from 'chart.js/auto'
import { Plus, Trash2, BookOpen, Target, Clock } from 'lucide-react'
import { PomodoroTimer } from '@/components/PomodoroTimer'

const SUBJECTS: StudySubject[] = ['语文', '数学', '英语', '政治', '专业课', '其他']

interface StudyPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

export function StudyPage({ showToast }: StudyPageProps) {
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [exams, setExams] = useState<ExamRecord[]>([])
  const [showStudyForm, setShowStudyForm] = useState(false)
  const [showExamForm, setShowExamForm] = useState(false)
  const [sDate, setSDate] = useState(todayStr())
  const [sSubject, setSSubject] = useState<StudySubject>('数学')
  const [sDuration, setSDuration] = useState('')
  const [sNote, setSNote] = useState('')
  const [eDate, setEDate] = useState(todayStr())
  const [eSubject, setESubject] = useState<StudySubject>('数学')
  const [eScore, setEScore] = useState('')
  const [eTotal, setETotal] = useState('100')
  const [eName, setEName] = useState('')
  const [eNote, setENote] = useState('')

  const studyChartRef = useRef<HTMLCanvasElement>(null)
  const studyChartInst = useRef<Chart | null>(null)
  const examChartRef = useRef<HTMLCanvasElement>(null)
  const examChartInst = useRef<Chart | null>(null)

  const loadData = () => {
    setRecords(Store.getRecords<StudyRecord>('studyRecords'))
    setExams(Store.getRecords<ExamRecord>('examRecords'))
  }

  useEffect(() => { loadData() }, [])

  // Study stacked bar chart
  useEffect(() => {
    if (!studyChartRef.current) return
    if (studyChartInst.current) studyChartInst.current.destroy()

    const days = getDateRange(14)
    const dayLabels = days.map((d) => formatDate(d))

    const datasets = SUBJECTS.map((subj) => ({
      label: subj,
      data: days.map((d) =>
        records.filter((r) => r.date === d && r.subject === subj).reduce((s, r) => s + r.duration, 0)
      ),
      backgroundColor: (CHART_COLORS.subjects as Record<string, string>)[subj],
      borderRadius: 4,
      borderSkipped: false,
    }))

    const ctx = studyChartRef.current.getContext('2d')!

    studyChartInst.current = new Chart(ctx, {
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
            ticks: { callback: (v) => v + ' min', font: { size: 10 } },
          },
        },
      },
    })

    return () => { studyChartInst.current?.destroy() }
  }, [records])

  // Exam line chart
  useEffect(() => {
    if (!examChartRef.current) return
    if (examChartInst.current) examChartInst.current.destroy()

    if (exams.length === 0) return

    const ctx = examChartRef.current.getContext('2d')!
    const subjectSet = [...new Set(exams.map((e) => e.subject))]
    const colors: Record<string, string> = CHART_COLORS.subjects

    const datasets = subjectSet.map((subj) => {
      const subjExams = exams.filter((e) => e.subject === subj).sort((a, b) => a.date.localeCompare(b.date))
      return {
        label: subj,
        data: subjExams.map((e) => e.score),
        borderColor: colors[subj] || '#6B7280',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderWidth: 2,
        spanGaps: true,
      }
    })

    const allDates = [...new Set(exams.map((e) => e.date))].sort()

    examChartInst.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allDates.map((d) => formatDate(d)),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 10 } } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 10 } } },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { font: { size: 10 } },
            min: 0,
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      },
    })

    return () => { examChartInst.current?.destroy() }
  }, [exams])

  const handleSaveStudy = () => {
    const duration = parseInt(sDuration)
    if (!sDate || isNaN(duration) || duration <= 0) {
      showToast('请填写日期和学习时长', 'error')
      return
    }
    Store.addRecord<StudyRecord>('studyRecords', {
      date: sDate,
      subject: sSubject,
      duration,
      note: sNote,
    } as StudyRecord)
    setShowStudyForm(false)
    resetStudyForm()
    loadData()
    showToast('学习记录已添加')
  }

  const handleSaveExam = () => {
    const score = parseInt(eScore)
    const total = parseInt(eTotal)
    if (!eDate || isNaN(score) || score < 0 || isNaN(total) || total <= 0) {
      showToast('请填写完整的成绩信息', 'error')
      return
    }
    Store.addRecord<ExamRecord>('examRecords', {
      date: eDate,
      subject: eSubject,
      score,
      totalScore: total,
      examName: eName || `${eDate} 考试`,
      note: eNote,
    } as ExamRecord)
    setShowExamForm(false)
    resetExamForm()
    loadData()
    showToast('成绩记录已添加')
  }

  const handleDeleteStudy = (id: string) => {
    Store.deleteRecord('studyRecords', id)
    loadData()
    showToast('记录已删除')
  }

  const handleDeleteExam = (id: string) => {
    Store.deleteRecord('examRecords', id)
    loadData()
    showToast('成绩记录已删除')
  }

  const resetStudyForm = () => {
    setSDate(todayStr())
    setSSubject('数学')
    setSDuration('')
    setSNote('')
  }

  const resetExamForm = () => {
    setEDate(todayStr())
    setESubject('数学')
    setEScore('')
    setETotal('100')
    setEName('')
    setENote('')
  }

  const todayStudy = Store.getDailyStudyMinutes(todayStr())
  const weekStudy = records.filter((r) => r.date >= getDateRange(7)[0]).reduce((s, r) => s + r.duration, 0)
  const totalStudy = records.reduce((s, r) => s + r.duration, 0)

  return (
    <div className="space-y-5">
      {/* 摘要 */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">今日学习</div>
            <div className="text-lg font-bold text-study">{todayStudy}<span className="text-xs font-normal">min</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">本周学习</div>
            <div className="text-lg font-bold text-study">{Math.floor(weekStudy / 60)}h {weekStudy % 60}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground">累计学习</div>
            <div className="text-lg font-bold text-study">{Math.floor(totalStudy / 60)}h</div>
          </CardContent>
        </Card>
      </div>

      {/* 番茄钟 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">番茄钟</CardTitle></CardHeader>
        <CardContent>
          <PomodoroTimer onComplete={(duration) => {
            setSDate(todayStr())
            setSDuration(duration.toString())
            setShowStudyForm(true)
          }} />
        </CardContent>
      </Card>

      {/* 每日学习时长堆叠图 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">学习时长趋势 (14天)</CardTitle>
            <Button size="sm" variant="study" onClick={() => { resetStudyForm(); setShowStudyForm(true) }}>
              <Plus className="w-4 h-4 mr-1" />记录
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="h-72">
              <canvas ref={studyChartRef} />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无学习记录</p>
              <p className="text-xs mt-1">记录每日学习时长，追踪进步</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 模拟考试成绩图 */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">模拟考试成绩</CardTitle>
            <Button size="sm" variant="outline" onClick={() => { resetExamForm(); setShowExamForm(true) }}>
              <Plus className="w-4 h-4 mr-1" />成绩
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {exams.length > 0 ? (
            <>
              <div className="h-64 mb-3">
                <canvas ref={examChartRef} />
              </div>
              <div className="space-y-1">
                {[...exams].reverse().map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent/50 group transition-colors text-sm">
                    <div>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-study-light text-study mr-2">{e.subject}</span>
                      <span className="text-xs text-muted-foreground">{e.examName || e.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-study">
                        {e.score}/{e.totalScore}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({((e.score / e.totalScore) * 100).toFixed(0)}%)
                        </span>
                      </span>
                      <button
                        onClick={() => handleDeleteExam(e.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">暂无成绩记录</p>
              <p className="text-xs mt-1">记录模考成绩，追踪学习效果</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 学习记录列表 */}
      {records.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">最近学习记录</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {[...records].reverse().slice(0, 30).map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-accent/50 group transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-study-light text-study flex-shrink-0">
                    {r.subject}
                  </span>
                  <div>
                    <div className="text-xs text-muted-foreground">{r.date}</div>
                    {r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-semibold text-study">
                    {Math.floor(r.duration / 60) > 0 ? `${Math.floor(r.duration / 60)}h ` : ''}{r.duration % 60}m
                  </span>
                  <button
                    onClick={() => handleDeleteStudy(r.id)}
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

      {/* Study Form Modal */}
      {showStudyForm && (
        <Modal
          title="新增学习记录"
          onClose={() => { setShowStudyForm(false); resetStudyForm() }}
          onSubmit={handleSaveStudy}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">日期</label>
              <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/30" />
            </div>
            <div>
              <label className="text-sm font-medium">科目</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {SUBJECTS.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSSubject(subj)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      sSubject === subj
                        ? 'bg-study text-study-foreground'
                        : 'bg-muted hover:bg-accent'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />学习时长 (分钟)
              </label>
              <input type="number" value={sDuration} onChange={(e) => setSDuration(e.target.value)}
                placeholder="例: 90" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/30" />
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <input type="text" value={sNote} onChange={(e) => setSNote(e.target.value)}
                placeholder="可选，如学习内容" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/30" />
            </div>
          </div>
        </Modal>
      )}

      {/* Exam Form Modal */}
      {showExamForm && (
        <Modal
          title="新增成绩记录"
          onClose={() => { setShowExamForm(false); resetExamForm() }}
          onSubmit={handleSaveExam}
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">日期</label>
              <input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/30" />
            </div>
            <div>
              <label className="text-sm font-medium">考试名称</label>
              <input type="text" value={eName} onChange={(e) => setEName(e.target.value)}
                placeholder="例: 5月模拟考" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/30" />
            </div>
            <div>
              <label className="text-sm font-medium">科目</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {SUBJECTS.map((subj) => (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setESubject(subj)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      eSubject === subj
                        ? 'bg-study text-study-foreground'
                        : 'bg-muted hover:bg-accent'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">得分</label>
                <input type="number" value={eScore} onChange={(e) => setEScore(e.target.value)}
                  placeholder="85" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/30" />
              </div>
              <div>
                <label className="text-sm font-medium">满分</label>
                <input type="number" value={eTotal} onChange={(e) => setETotal(e.target.value)}
                  placeholder="100" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/30" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">备注</label>
              <input type="text" value={eNote} onChange={(e) => setENote(e.target.value)}
                placeholder="可选" className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/30" />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
