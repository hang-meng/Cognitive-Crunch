// ============================================================
// 类型定义
// ============================================================

export interface WeightRecord {
  id: string
  date: string
  weight: number
  note: string
}

export interface MeasurementRecord {
  id: string
  date: string
  waist: number
  hip: number
  chest: number
  arm: number
  thigh: number
  note: string
}

export interface DietRecord {
  id: string
  date: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  foodName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  note: string
}

export type ExerciseType = 'running' | 'cycling' | 'swimming' | 'strength' | 'hiit' | 'yoga' | 'walking' | 'other'

export interface ExerciseRecord {
  id: string
  date: string
  type: ExerciseType
  duration: number
  calories: number
  note: string
}

export type StudySubject = '语文' | '数学' | '英语' | '政治' | '专业课' | '其他'

export interface StudyRecord {
  id: string
  date: string
  subject: StudySubject
  duration: number
  note: string
}

export interface ExamRecord {
  id: string
  date: string
  subject: StudySubject
  score: number
  totalScore: number
  examName: string
  note: string
}

export interface UserProfile {
  name: string
  height: number
  gender: 'male' | 'female'
  targetWeight?: number
  dailyCalorieTarget?: number
  dailyStudyTarget?: number
  dailyWaterTarget?: number
}

export interface WaterRecord {
  id: string
  date: string
  amount: number
  note: string
}

export interface SleepRecord {
  id: string
  date: string
  bedTime: string
  wakeTime: string
  quality: number
  note: string
}

export interface Milestone {
  id: string
  type: 'weight-low' | 'streak' | 'study-hours' | 'exam-score' | 'record-count'
  title: string
  description: string
  date: string
  seen: boolean
}

export interface AppData {
  version: number
  userProfile: UserProfile
  weightRecords: WeightRecord[]
  measurementRecords: MeasurementRecord[]
  dietRecords: DietRecord[]
  exerciseRecords: ExerciseRecord[]
  studyRecords: StudyRecord[]
  examRecords: ExamRecord[]
  waterRecords: WaterRecord[]
  sleepRecords: SleepRecord[]
  milestones: Milestone[]
  darkMode: boolean
}

export type RecordType = 'weightRecords' | 'measurementRecords' | 'dietRecords' | 'exerciseRecords' | 'studyRecords' | 'examRecords' | 'waterRecords' | 'sleepRecords'

// ============================================================
// 工具函数
// ============================================================

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  )
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

export function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`
}

export function getDateRange(days: number): string[] {
  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

// ============================================================
// Store - localStorage 数据层
// ============================================================

const STORAGE_KEY = 'fitness-study-tracker-data'

const DEFAULT_DATA: AppData = {
  version: 2,
  userProfile: {
    name: '',
    height: 170,
    gender: 'male',
    dailyCalorieTarget: 2000,
    dailyStudyTarget: 120,
    dailyWaterTarget: 2000,
  },
  weightRecords: [],
  measurementRecords: [],
  dietRecords: [],
  exerciseRecords: [],
  studyRecords: [],
  examRecords: [],
  waterRecords: [],
  sleepRecords: [],
  milestones: [],
  darkMode: false,
}

export const Store = {
  load(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return structuredClone(DEFAULT_DATA)
      const data = JSON.parse(raw) as AppData
      if (!data.version) return structuredClone(DEFAULT_DATA)
      return data
    } catch {
      return structuredClone(DEFAULT_DATA)
    }
  },

  save(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('localStorage 存储失败，可能容量已满', e)
      alert('数据存储失败！浏览器存储空间可能已满，请导出数据后清理。')
    }
  },

  getRecords<T>(type: RecordType): T[] {
    const data = this.load()
    return (data[type] as unknown as T[]) || []
  },

  addRecord<T extends { id: string; date: string }>(type: RecordType, record: Omit<T, 'id'>): T {
    const data = this.load()
    const newRecord = { ...record, id: generateId() } as unknown as T
    const records = data[type] as unknown as T[]
    records.push(newRecord)
    // 按日期排序
    records.sort((a, b) => a.date.localeCompare(b.date))
    data[type] = records as any
    this.save(data)
    return newRecord
  },

  updateRecord<T extends { id: string }>(type: RecordType, id: string, updates: Partial<T>): boolean {
    const data = this.load()
    const records = data[type] as unknown as T[]
    const index = records.findIndex((r) => r.id === id)
    if (index === -1) return false
    records[index] = { ...records[index], ...updates }
    data[type] = records as any
    this.save(data)
    return true
  },

  deleteRecord(type: RecordType, id: string): boolean {
    const data = this.load()
    const records = data[type] as unknown as Array<{ id: string }>
    const filtered = records.filter((r) => r.id !== id)
    if (filtered.length === records.length) return false
    data[type] = filtered as any
    this.save(data)
    return true
  },

  getRecordsByDateRange<T extends { date: string }>(type: RecordType, startDate: string, endDate: string): T[] {
    const records = this.getRecords(type) as unknown as T[]
    return records.filter((r) => r.date >= startDate && r.date <= endDate)
  },

  getDailyCalories(date: string): number {
    const records = this.getRecordsByDateRange<DietRecord>('dietRecords', date, date)
    return records.reduce((sum, r) => sum + r.calories, 0)
  },

  getDailyExerciseCalories(date: string): number {
    const records = this.getRecordsByDateRange<ExerciseRecord>('exerciseRecords', date, date)
    return records.reduce((sum, r) => sum + r.calories, 0)
  },

  getDailyStudyMinutes(date: string): number {
    const records = this.getRecordsByDateRange<StudyRecord>('studyRecords', date, date)
    return records.reduce((sum, r) => sum + r.duration, 0)
  },

  getDailyWater(date: string): number {
    const records = this.getRecordsByDateRange<WaterRecord>('waterRecords', date, date)
    return records.reduce((sum, r) => sum + r.amount, 0)
  },

  addWater(amount: number): WaterRecord {
    return this.addRecord<WaterRecord>('waterRecords', {
      date: todayStr(),
      amount,
      note: '',
    } as Omit<WaterRecord, 'id'>)
  },

  getSleepDuration(bedTime: string, wakeTime: string): number {
    const [bh, bm] = bedTime.split(':').map(Number)
    let [wh, wm] = wakeTime.split(':').map(Number)
    let bedMin = bh * 60 + bm
    let wakeMin = wh * 60 + wm
    if (wakeMin <= bedMin) wakeMin += 24 * 60
    return +( (wakeMin - bedMin) / 60 ).toFixed(1)
  },

  getLastSleep(): { record: SleepRecord; duration: number } | null {
    const data = this.load()
    const records = data.sleepRecords
    if (records.length === 0) return null
    const last = records[records.length - 1]
    return { record: last, duration: this.getSleepDuration(last.bedTime, last.wakeTime) }
  },

  getWeeklySleepAvg(): number | null {
    const data = this.load()
    const last7 = getDateRange(7)[0]
    const weekRecords = data.sleepRecords.filter((r) => r.date >= last7)
    if (weekRecords.length === 0) return null
    const total = weekRecords.reduce((s, r) => s + this.getSleepDuration(r.bedTime, r.wakeTime), 0)
    return +(total / weekRecords.length).toFixed(1)
  },

  getWeightTrend(days: number): { date: string; weight: number }[] {
    const records = this.getRecords<WeightRecord>('weightRecords')
    const start = getDateRange(days)[0]
    const filtered = records.filter((r) => r.date >= start)
    const dateMap = new Map<string, number>()
    filtered.forEach((r) => {
      dateMap.set(r.date, r.weight)
    })
    return getDateRange(days).map((date) => ({
      date,
      weight: dateMap.get(date) || 0,
    }))
  },

  exportAll(): string {
    const data = this.load()
    return JSON.stringify(data, null, 2)
  },

  importAll(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString) as AppData
      if (!data.version || !data.weightRecords || !data.userProfile) {
        throw new Error('数据格式不正确')
      }
      this.save(data)
      return true
    } catch {
      return false
    }
  },

  getStats() {
    const data = this.load()
    const today = todayStr()
    const last7 = getDateRange(7)

    // 最新体重
    const weightRecords = data.weightRecords
    const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weight : null
    const firstWeekWeight = weightRecords.length > 0
      ? weightRecords.filter((r) => r.date >= last7[0])[0]?.weight || latestWeight
      : null
    const weightChange = latestWeight && firstWeekWeight ? +(latestWeight - firstWeekWeight).toFixed(1) : null

    // 今日摄入（内联，避免 getDailyCalories 重复 load）
    const todayCalories = data.dietRecords
      .filter((r) => r.date === today)
      .reduce((sum, r) => sum + r.calories, 0)

    // 今日运动消耗（内联，避免 getDailyExerciseCalories 重复 load）
    const todayBurned = data.exerciseRecords
      .filter((r) => r.date === today)
      .reduce((sum, r) => sum + r.calories, 0)

    // 今日学习（内联，避免 getDailyStudyMinutes 重复 load）
    const todayStudy = data.studyRecords
      .filter((r) => r.date === today)
      .reduce((sum, r) => sum + r.duration, 0)

    // 本周学习时长
    const weekStudy = data.studyRecords
      .filter((r) => r.date >= last7[0])
      .reduce((sum, r) => sum + r.duration, 0)

    // 最新模考
    const examRecords = data.examRecords
    const latestExam = examRecords.length > 0 ? examRecords[examRecords.length - 1] : null

    // 今日饮水（内联，避免重复 load）
    const todayWater = data.waterRecords
      .filter((r) => r.date === today)
      .reduce((sum, r) => sum + r.amount, 0)

    return {
      latestWeight,
      weightChange,
      todayCalories,
      todayBurned,
      todayStudy,
      todayWater,
      weekStudy,
      latestExam,
      totalRecords: weightRecords.length + data.dietRecords.length + data.exerciseRecords.length + data.studyRecords.length,
    }
  },

  // 用户设置
  updateProfile(profile: Partial<UserProfile>): void {
    const data = this.load()
    data.userProfile = { ...data.userProfile, ...profile }
    this.save(data)
  },

  getDarkMode(): boolean {
    return this.load().darkMode
  },

  setDarkMode(enabled: boolean): void {
    const data = this.load()
    data.darkMode = enabled
    this.save(data)
  },

  // 连续打卡天数（任意记录类型）
  getStreak(): number {
    const data = this.load()
    const allDates = new Set<string>()
    const addDates = (records: { date: string }[]) => records.forEach((r) => allDates.add(r.date))
    addDates(data.weightRecords)
    addDates(data.dietRecords)
    addDates(data.exerciseRecords)
    addDates(data.studyRecords)
    addDates(data.measurementRecords)
    addDates(data.waterRecords)

    let streak = 0
    const today = new Date(todayStr() + 'T00:00:00')
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (allDates.has(ds)) {
        streak++
      } else if (i === 0) {
        // 今天没记录，不算断签
        continue
      } else {
        break
      }
    }
    return streak
  },

  // 里程碑检查和记录
  checkMilestones(): Milestone[] {
    const data = this.load()
    const newMilestones: Milestone[] = []
    const existingTypes = new Set(data.milestones.map((m) => m.type))

    // 体重新低
    const weights = data.weightRecords.map((r) => r.weight)
    if (weights.length >= 3) {
      const minWeight = Math.min(...weights)
      const latestWeight = weights[weights.length - 1]
      if (latestWeight === minWeight && latestWeight > 0 && !existingTypes.has('weight-low')) {
        newMilestones.push({
          id: generateId(),
          type: 'weight-low',
          title: '体重新低！',
          description: `达到历史最低体重 ${latestWeight} kg，继续加油！`,
          date: todayStr(),
          seen: false,
        })
      }
    }

    // 连续打卡
    const streak = this.getStreak()
    if (streak >= 7 && !data.milestones.some((m) => m.type === 'streak' && m.date >= getDateRange(7)[0])) {
      newMilestones.push({
        id: generateId(),
        type: 'streak',
        title: '连续打卡！',
        description: `已连续打卡 ${streak} 天，太棒了！`,
        date: todayStr(),
        seen: false,
      })
    }

    // 累计学习100小时
    const totalStudyMinutes = data.studyRecords.reduce((s, r) => s + r.duration, 0)
    const studyHours100 = Math.floor(totalStudyMinutes / 6000) // 每100小时
    const existingStudyCount = data.milestones.filter((m) => m.type === 'study-hours').length
    if (studyHours100 > existingStudyCount) {
      newMilestones.push({
        id: generateId(),
        type: 'study-hours',
        title: '学习里程碑！',
        description: `累计学习达到 ${studyHours100 * 100} 小时！`,
        date: todayStr(),
        seen: false,
      })
    }

    // 成绩突破90%
    const examRecords = data.examRecords
    if (examRecords.length > 0) {
      const latest = examRecords[examRecords.length - 1]
      const pct = (latest.score / latest.totalScore) * 100
      if (pct >= 90 && !existingTypes.has('exam-score')) {
        newMilestones.push({
          id: generateId(),
          type: 'exam-score',
          title: '成绩突破！',
          description: `${latest.subject} 模考达到 ${pct.toFixed(0)}%，优秀！`,
          date: todayStr(),
          seen: false,
        })
      }
    }

    if (newMilestones.length > 0) {
      data.milestones.push(...newMilestones)
      this.save(data)
    }
    return [...data.milestones.filter((m) => !m.seen)]
  },

  markMilestoneSeen(id: string): void {
    const data = this.load()
    const m = data.milestones.find((m) => m.id === id)
    if (m) {
      m.seen = true
      this.save(data)
    }
  },

  // 周报
  getWeeklyReport() {
    const days = getDateRange(7)
    const start = days[0]
    const end = days[days.length - 1]
    const data = this.load()

    const weekWeights = data.weightRecords.filter((r) => r.date >= start && r.date <= end)
    const weekDiets = data.dietRecords.filter((r) => r.date >= start && r.date <= end)
    const weekExercises = data.exerciseRecords.filter((r) => r.date >= start && r.date <= end)
    const weekStudies = data.studyRecords.filter((r) => r.date >= start && r.date <= end)

    const totalCaloriesIn = weekDiets.reduce((s, r) => s + r.calories, 0)
    const totalCaloriesOut = weekExercises.reduce((s, r) => s + r.calories, 0)
    const totalStudyMin = weekStudies.reduce((s, r) => s + r.duration, 0)

    // 按科目汇总
    const bySubject: Record<string, number> = {}
    weekStudies.forEach((r) => {
      bySubject[r.subject] = (bySubject[r.subject] || 0) + r.duration
    })

    const startWeight = weekWeights.length > 0 ? weekWeights[0].weight : null
    const endWeight = weekWeights.length > 0 ? weekWeights[weekWeights.length - 1].weight : null

    return {
      startDate: start,
      endDate: end,
      totalCaloriesIn,
      totalCaloriesOut,
      netCalories: totalCaloriesIn - totalCaloriesOut,
      totalStudyMin,
      bySubject,
      weightStart: startWeight,
      weightEnd: endWeight,
      weightChange: startWeight && endWeight ? +(endWeight - startWeight).toFixed(1) : null,
      recordDays: new Set([...weekDiets, ...weekExercises, ...weekStudies, ...weekWeights].map((r) => r.date)).size,
    }
  },

  // 月报
  getMonthlyReport(monthOffset = 0) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() - monthOffset
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const lastDay = new Date(year, month + 1, 0).getDate()
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const data = this.load()

    const monthWeights = data.weightRecords.filter((r) => r.date >= startDate && r.date <= endDate)
    const monthDiets = data.dietRecords.filter((r) => r.date >= startDate && r.date <= endDate)
    const monthExercises = data.exerciseRecords.filter((r) => r.date >= startDate && r.date <= endDate)
    const monthStudies = data.studyRecords.filter((r) => r.date >= startDate && r.date <= endDate)
    const monthExams = data.examRecords.filter((r) => r.date >= startDate && r.date <= endDate)

    const totalCaloriesIn = monthDiets.reduce((s, r) => s + r.calories, 0)
    const totalCaloriesOut = monthExercises.reduce((s, r) => s + r.calories, 0)
    const totalStudyMin = monthStudies.reduce((s, r) => s + r.duration, 0)

    const bySubject: Record<string, number> = {}
    monthStudies.forEach((r) => {
      bySubject[r.subject] = (bySubject[r.subject] || 0) + r.duration
    })

    const startWeight = monthWeights.length > 0 ? monthWeights[0].weight : null
    const endWeight = monthWeights.length > 0 ? monthWeights[monthWeights.length - 1].weight : null
    const bestExam = monthExams.length > 0
      ? monthExams.reduce((best, e) => (e.score / e.totalScore) > (best.score / best.totalScore) ? e : best, monthExams[0])
      : null

    return {
      startDate,
      endDate,
      year,
      month: month + 1,
      totalCaloriesIn,
      totalCaloriesOut,
      netCalories: totalCaloriesIn - totalCaloriesOut,
      totalStudyMin,
      bySubject,
      weightStart: startWeight,
      weightEnd: endWeight,
      weightChange: startWeight && endWeight ? +(endWeight - startWeight).toFixed(1) : null,
      recordDays: new Set([...monthDiets, ...monthExercises, ...monthStudies, ...monthWeights].map((r) => r.date)).size,
      bestExam: bestExam
        ? { subject: bestExam.subject, score: bestExam.score, total: bestExam.totalScore, name: bestExam.examName }
        : null,
      examCount: monthExams.length,
    }
  },
}

// ============================================================
// 食品热量数据库 (常见食物，每100g/份)
// ============================================================

export interface FoodItem {
  name: string
  category: string
  calories: number  // per 100g or per serving
  unit: string
  protein: number
  carbs: number
  fat: number
}

export const FOOD_DATABASE: FoodItem[] = [
  // 主食
  { name: '米饭', category: '主食', calories: 116, unit: '100g', protein: 2.6, carbs: 25.9, fat: 0.3 },
  { name: '馒头', category: '主食', calories: 223, unit: '100g', protein: 7.0, carbs: 44.2, fat: 1.1 },
  { name: '面条(煮)', category: '主食', calories: 110, unit: '100g', protein: 3.5, carbs: 22.0, fat: 0.5 },
  { name: '全麦面包', category: '主食', calories: 246, unit: '100g', protein: 9.0, carbs: 43.0, fat: 3.4 },
  { name: '白面包', category: '主食', calories: 265, unit: '100g', protein: 8.0, carbs: 49.0, fat: 3.2 },
  { name: '燕麦片', category: '主食', calories: 377, unit: '100g', protein: 13.5, carbs: 61.6, fat: 6.7 },
  { name: '红薯', category: '主食', calories: 86, unit: '100g', protein: 1.6, carbs: 20.1, fat: 0.1 },
  { name: '玉米', category: '主食', calories: 112, unit: '100g', protein: 4.0, carbs: 22.8, fat: 1.2 },
  { name: '小米粥', category: '主食', calories: 46, unit: '100g', protein: 1.4, carbs: 8.4, fat: 0.7 },

  // 肉类
  { name: '鸡胸肉', category: '肉类', calories: 133, unit: '100g', protein: 31.0, carbs: 0, fat: 1.2 },
  { name: '鸡腿肉', category: '肉类', calories: 181, unit: '100g', protein: 19.4, carbs: 0, fat: 11.0 },
  { name: '牛肉(瘦)', category: '肉类', calories: 125, unit: '100g', protein: 20.2, carbs: 0.2, fat: 4.2 },
  { name: '猪肉(瘦)', category: '肉类', calories: 143, unit: '100g', protein: 20.3, carbs: 1.5, fat: 6.2 },
  { name: '猪排骨', category: '肉类', calories: 264, unit: '100g', protein: 18.3, carbs: 0, fat: 20.4 },
  { name: '羊肉', category: '肉类', calories: 203, unit: '100g', protein: 19.0, carbs: 0, fat: 14.1 },
  { name: '鸭肉', category: '肉类', calories: 240, unit: '100g', protein: 15.5, carbs: 0.2, fat: 19.7 },

  // 水产
  { name: '三文鱼', category: '水产', calories: 208, unit: '100g', protein: 20.4, carbs: 0, fat: 13.4 },
  { name: '虾仁', category: '水产', calories: 99, unit: '100g', protein: 20.3, carbs: 0.2, fat: 0.7 },
  { name: '带鱼', category: '水产', calories: 127, unit: '100g', protein: 17.7, carbs: 0, fat: 4.9 },
  { name: '鲫鱼', category: '水产', calories: 108, unit: '100g', protein: 17.1, carbs: 0, fat: 4.3 },

  // 蛋奶
  { name: '鸡蛋(煮)', category: '蛋奶', calories: 144, unit: '100g(约2个)', protein: 13.3, carbs: 1.5, fat: 9.5 },
  { name: '鸡蛋(1个)', category: '蛋奶', calories: 72, unit: '1个(50g)', protein: 6.7, carbs: 0.8, fat: 4.8 },
  { name: '牛奶(全脂)', category: '蛋奶', calories: 65, unit: '100ml', protein: 3.1, carbs: 4.8, fat: 3.4 },
  { name: '酸奶(原味)', category: '蛋奶', calories: 72, unit: '100ml', protein: 2.5, carbs: 10.0, fat: 2.5 },
  { name: '豆浆', category: '蛋奶', calories: 31, unit: '100ml', protein: 2.4, carbs: 1.2, fat: 1.6 },

  // 蔬菜
  { name: '西兰花', category: '蔬菜', calories: 34, unit: '100g', protein: 2.8, carbs: 6.6, fat: 0.4 },
  { name: '番茄', category: '蔬菜', calories: 18, unit: '100g', protein: 0.9, carbs: 3.9, fat: 0.2 },
  { name: '黄瓜', category: '蔬菜', calories: 15, unit: '100g', protein: 0.8, carbs: 2.9, fat: 0.2 },
  { name: '菠菜', category: '蔬菜', calories: 23, unit: '100g', protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: '白菜', category: '蔬菜', calories: 13, unit: '100g', protein: 1.5, carbs: 2.2, fat: 0.2 },
  { name: '胡萝卜', category: '蔬菜', calories: 37, unit: '100g', protein: 1.0, carbs: 8.8, fat: 0.2 },
  { name: '土豆', category: '蔬菜', calories: 76, unit: '100g', protein: 2.0, carbs: 17.2, fat: 0.2 },

  // 水果
  { name: '苹果', category: '水果', calories: 52, unit: '100g', protein: 0.3, carbs: 13.8, fat: 0.2 },
  { name: '香蕉', category: '水果', calories: 89, unit: '100g', protein: 1.1, carbs: 22.8, fat: 0.3 },
  { name: '橙子', category: '水果', calories: 47, unit: '100g', protein: 0.9, carbs: 11.8, fat: 0.1 },
  { name: '葡萄', category: '水果', calories: 67, unit: '100g', protein: 0.7, carbs: 17.2, fat: 0.2 },
  { name: '西瓜', category: '水果', calories: 30, unit: '100g', protein: 0.6, carbs: 6.8, fat: 0.1 },
  { name: '草莓', category: '水果', calories: 32, unit: '100g', protein: 0.7, carbs: 7.7, fat: 0.3 },

  // 零食饮品
  { name: '奶茶(中杯)', category: '饮品', calories: 350, unit: '1杯(500ml)', protein: 4.0, carbs: 45.0, fat: 15.0 },
  { name: '可乐', category: '饮品', calories: 42, unit: '100ml', protein: 0, carbs: 10.6, fat: 0 },
  { name: '拿铁咖啡', category: '饮品', calories: 56, unit: '100ml', protein: 2.7, carbs: 3.8, fat: 2.9 },
  { name: '薯片', category: '零食', calories: 536, unit: '100g', protein: 5.2, carbs: 49.7, fat: 35.0 },
  { name: '巧克力', category: '零食', calories: 546, unit: '100g', protein: 5.4, carbs: 59.4, fat: 31.3 },
  { name: '坚果(混合)', category: '零食', calories: 607, unit: '100g', protein: 20.0, carbs: 20.0, fat: 50.0 },
  { name: '饼干', category: '零食', calories: 433, unit: '100g', protein: 8.0, carbs: 70.0, fat: 14.0 },

  // 常见菜式
  { name: '蛋炒饭', category: '菜式', calories: 188, unit: '100g', protein: 5.6, carbs: 25.0, fat: 6.7 },
  { name: '麻辣烫(素)', category: '菜式', calories: 80, unit: '100g', protein: 3.0, carbs: 10.0, fat: 3.0 },
  { name: '宫保鸡丁', category: '菜式', calories: 180, unit: '100g', protein: 15.0, carbs: 8.0, fat: 10.0 },
  { name: '饺子(猪肉)', category: '菜式', calories: 240, unit: '100g(约5个)', protein: 7.5, carbs: 28.0, fat: 10.0 },
  { name: '火锅(清汤底)', category: '菜式', calories: 150, unit: '100g(综合)', protein: 12.0, carbs: 5.0, fat: 9.0 },
  { name: '炸鸡腿', category: '菜式', calories: 260, unit: '100g', protein: 16.0, carbs: 8.0, fat: 18.0 },
  { name: '沙拉(酱汁)', category: '菜式', calories: 90, unit: '100g', protein: 2.0, carbs: 5.0, fat: 6.5 },
]

export function searchFood(query: string): FoodItem[] {
  const q = query.toLowerCase()
  if (!q) return []
  return FOOD_DATABASE.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q)
  ).slice(0, 12)
}

// BMI 等级
export function getBMICategory(bmi: number): { label: string; color: string; textColor: string } {
  if (bmi < 18.5) return { label: '偏瘦', color: '#3B82F6', textColor: 'text-blue-500' }
  if (bmi < 24) return { label: '正常', color: '#10B981', textColor: 'text-fitness' }
  if (bmi < 28) return { label: '偏重', color: '#F59E0B', textColor: 'text-diet' }
  return { label: '超重', color: '#EF4444', textColor: 'text-exercise' }
}

// ============================================================
// 图表主题色
// ============================================================

export const CHART_COLORS = {
  fitness: '#10B981',
  fitnessAlpha: 'rgba(16, 185, 129, 0.2)',
  diet: '#F59E0B',
  dietAlpha: 'rgba(245, 158, 11, 0.2)',
  exercise: '#EF4444',
  exerciseAlpha: 'rgba(239, 68, 68, 0.2)',
  study: '#6366F1',
  studyAlpha: 'rgba(99, 102, 241, 0.2)',
  subjects: {
    '语文': '#EF4444',
    '数学': '#3B82F6',
    '英语': '#10B981',
    '政治': '#F59E0B',
    '专业课': '#8B5CF6',
    '其他': '#6B7280',
  },
}

export const EXERCISE_LABELS: Record<ExerciseType, string> = {
  running: '跑步',
  cycling: '骑行',
  swimming: '游泳',
  strength: '力量训练',
  hiit: 'HIIT',
  yoga: '瑜伽',
  walking: '快走',
  other: '其他',
}

export const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}
