import { useState } from 'react'
import { Store, UserProfile, getBMICategory } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, User } from 'lucide-react'

interface SettingsPageProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  onClose: () => void
}

export function SettingsPage({ showToast, onClose }: SettingsPageProps) {
  const data = Store.load()
  const profile = data.userProfile
  const [name, setName] = useState(profile.name)
  const [height, setHeight] = useState(profile.height.toString())
  const [gender, setGender] = useState<'male' | 'female'>(profile.gender)
  const [targetWeight, setTargetWeight] = useState(profile.targetWeight?.toString() || '')
  const [dailyCalorieTarget, setDailyCalorieTarget] = useState(profile.dailyCalorieTarget?.toString() || '2000')
  const [dailyStudyTarget, setDailyStudyTarget] = useState(profile.dailyStudyTarget?.toString() || '120')

  const handleSave = () => {
    const h = parseInt(height)
    const tw = parseFloat(targetWeight)
    const cal = parseInt(dailyCalorieTarget)
    const study = parseInt(dailyStudyTarget)

    if (isNaN(h) || h < 100 || h > 250) {
      showToast('请输入有效身高(100-250cm)', 'error')
      return
    }

    Store.updateProfile({
      name,
      height: h,
      gender,
      targetWeight: isNaN(tw) ? undefined : tw,
      dailyCalorieTarget: isNaN(cal) ? 2000 : cal,
      dailyStudyTarget: isNaN(study) ? 120 : study,
    })
    showToast('设置已保存')
    onClose()
  }

  const latestWeight = data.weightRecords.length > 0
    ? data.weightRecords[data.weightRecords.length - 1].weight
    : null
  const bmi = latestWeight && height ? +(latestWeight / ((parseInt(height) / 100) ** 2)).toFixed(1) : null
  const bmiCat = bmi ? getBMICategory(bmi) : null

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-5 h-5 text-primary" />
            个人信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">昵称</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="给自己起个名字吧"
              className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">身高 (cm)</label>
              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="text-sm font-medium">性别</label>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${gender === 'male' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
                >男</button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${gender === 'female' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-accent'}`}
                >女</button>
              </div>
            </div>
          </div>

          {bmi !== null && bmiCat && (
            <div className="p-3 rounded-lg bg-accent flex items-center justify-between">
              <span className="text-sm">当前 BMI</span>
              <span className="font-bold">{bmi}
                <span className={`ml-2 text-xs ${bmiCat.textColor}`}>({bmiCat.label})</span>
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">目标设定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">目标体重 (kg)</label>
              <input type="number" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="60" step="0.1"
                className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-fitness/20" />
            </div>
            <div>
              <label className="text-sm font-medium">每日热量上限 (kcal)</label>
              <input type="number" value={dailyCalorieTarget} onChange={(e) => setDailyCalorieTarget(e.target.value)}
                placeholder="2000"
                className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/20" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">每日学习目标 (分钟)</label>
            <input type="number" value={dailyStudyTarget} onChange={(e) => setDailyStudyTarget(e.target.value)}
              placeholder="120"
              className="w-full mt-1.5 px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-study/20" />
          </div>
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSave}>
        <Save className="w-4 h-4 mr-2" />保存设置
      </Button>
    </div>
  )
}
