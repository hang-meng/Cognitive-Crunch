import { useState, useEffect, useCallback, memo } from 'react'
import { Store, AppData, todayStr } from '@/lib/store'
import { DashboardPage } from '@/pages/DashboardPage'
import { WeightPage } from '@/pages/WeightPage'
import { DietPage } from '@/pages/DietPage'
import { ExercisePage } from '@/pages/ExercisePage'
import { StudyPage } from '@/pages/StudyPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ReportPage } from '@/pages/ReportPage'
import { Toast, ToastMessage } from '@/components/Toast'
import { DataManager } from '@/components/DataManager'
import { MilestoneNotification } from '@/components/MilestoneNotification'
import {
  LayoutDashboard, Scale, Utensils, Dumbbell, BookOpen,
  Download, Sun, Moon, Settings, BarChart3, Flame,
} from 'lucide-react'

const TABS = [
  { label: '概览', icon: LayoutDashboard },
  { label: '体重', icon: Scale },
  { label: '饮食', icon: Utensils },
  { label: '运动', icon: Dumbbell },
  { label: '学习', icon: BookOpen },
]

const MORE_TABS = [
  { label: '统计', icon: BarChart3 },
  { label: '设置', icon: Settings },
]

function App() {
  const [currentTab, setCurrentTab] = useState(0)
  const [dataVersion, setDataVersion] = useState(0)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [showDataManager, setShowDataManager] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [streak, setStreak] = useState(0)
  const [darkMode, setDarkMode] = useState(false)
  const [showMilestones, setShowMilestones] = useState(false)

  // Init dark mode
  useEffect(() => {
    const dm = Store.getDarkMode()
    setDarkMode(dm)
    if (dm) document.documentElement.classList.add('dark')
  }, [])

  // Check milestones on load
  useEffect(() => {
    const ms = Store.checkMilestones()
    if (ms.some((m) => !m.seen)) {
      setShowMilestones(true)
    }
  }, [])

  const refreshData = useCallback(() => {
    setDataVersion((v) => v + 1)
    setStreak(Store.getStreak())
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }, [])

  const toggleDarkMode = useCallback(() => {
    const newMode = !darkMode
    setDarkMode(newMode)
    Store.setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleCloseSettings = useCallback(() => {
    setShowSettings(false)
    refreshData()
  }, [refreshData])

  const handleCloseReport = useCallback(() => {
    setShowReport(false)
  }, [])

  const handleImport = useCallback((jsonStr: string): boolean => {
    if (Store.importAll(jsonStr)) {
      refreshData()
      showToast('数据导入成功！')
      return true
    }
    showToast('数据格式错误，导入失败', 'error')
    return false
  }, [refreshData, showToast])

  const handleExport = useCallback(() => {
    const json = Store.exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fitness-study-backup-${todayStr()}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('数据已导出！')
  }, [showToast])

  const handleDeleteAll = useCallback(() => {
    const empty: AppData = {
      version: 2,
      userProfile: { name: '', height: 170, gender: 'male', dailyCalorieTarget: 2000, dailyStudyTarget: 120 },
      weightRecords: [],
      measurementRecords: [],
      dietRecords: [],
      exerciseRecords: [],
      studyRecords: [],
      examRecords: [],
      milestones: [],
      darkMode: false,
    }
    Store.save(empty)
    refreshData()
    showToast('所有数据已清空')
  }, [refreshData, showToast])

  // Refresh streak periodically
  useEffect(() => {
    setStreak(Store.getStreak())
    const interval = setInterval(() => setStreak(Store.getStreak()), 60000)
    return () => clearInterval(interval)
  }, [dataVersion])

  const renderPage = () => {
    const key = `${currentTab}-${dataVersion}`
    switch (currentTab) {
      case 0: return <DashboardPage key={key} showToast={showToast} />
      case 1: return <WeightPage key={key} showToast={showToast} />
      case 2: return <DietPage key={key} showToast={showToast} />
      case 3: return <ExercisePage key={key} showToast={showToast} />
      case 4: return <StudyPage key={key} showToast={showToast} />
      default: return null
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-gradient-fitness">健身</span>
              <span className="text-muted-foreground mx-1">&</span>
              <span className="text-gradient-study">学习</span>
            </h1>
            {streak > 0 && (
              <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                <Flame className="w-3 h-3 text-diet" />{streak}天
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title={darkMode ? '切换亮色' : '切换暗色'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-diet" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* Report */}
            <button
              onClick={() => setShowReport(true)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="统计报告"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            {/* Settings */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="设置"
            >
              <Settings className="w-4 h-4" />
            </button>
            {/* Data */}
            <button
              onClick={() => setShowDataManager(true)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              title="数据管理"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-4xl mx-auto p-4 animate-fade-in">
          {renderPage()}
        </div>
      </main>

      {/* Bottom Tab Bar - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/90 backdrop-blur-lg safe-bottom md:hidden">
        <div className="flex items-center justify-around h-16 max-w-4xl mx-auto">
          {TABS.map((tab, index) => {
            const Icon = tab.icon
            const isActive = currentTab === index
            return (
              <button
                key={tab.label}
                onClick={() => setCurrentTab(index)}
                className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Side Nav - Desktop */}
      <nav className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 flex-col gap-1 z-40">
        {TABS.map((tab, index) => {
          const Icon = tab.icon
          const isActive = currentTab === index
          return (
            <button
              key={tab.label}
              onClick={() => setCurrentTab(index)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              title={tab.label}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 animate-fade-in">
          <div className="w-full md:max-w-md bg-card border md:rounded-2xl rounded-t-2xl shadow-xl animate-slide-up max-h-[85vh] overflow-auto p-5">
            <SettingsPage
              showToast={showToast}
              onClose={handleCloseSettings}
            />
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 animate-fade-in">
          <div className="w-full md:max-w-lg bg-card border md:rounded-2xl rounded-t-2xl shadow-xl animate-slide-up max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-card z-10">
              <h2 className="text-lg font-semibold">统计报告</h2>
              <button onClick={handleCloseReport} className="p-1 rounded-lg hover:bg-accent">
                <Settings className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <ReportPage showToast={showToast} />
            </div>
          </div>
        </div>
      )}

      {/* Data Manager Modal */}
      {showDataManager && (
        <DataManager
          onClose={() => setShowDataManager(false)}
          onExport={handleExport}
          onImport={handleImport}
          onDeleteAll={handleDeleteAll}
        />
      )}

      {/* Milestone Notification */}
      {showMilestones && (
        <MilestoneNotification onClose={() => setShowMilestones(false)} />
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  )
}

export default App
