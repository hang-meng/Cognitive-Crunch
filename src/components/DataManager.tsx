import { useState, useRef } from 'react'
import { X, Download, Upload, Trash2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DataManagerProps {
  onClose: () => void
  onExport: () => void
  onImport: (jsonStr: string) => boolean
  onDeleteAll: () => void
}

export function DataManager({ onClose, onExport, onImport, onDeleteAll }: DataManagerProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      onImport(text)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
      <div className="w-full max-w-sm bg-card border rounded-2xl shadow-xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">数据管理</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-accent transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={onExport}
          >
            <Download className="w-5 h-5 text-fitness" />
            <div className="text-left">
              <div className="text-sm font-medium">导出数据</div>
              <div className="text-xs text-muted-foreground">下载为 JSON 备份文件</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-5 h-5 text-study" />
            <div className="text-left">
              <div className="text-sm font-medium">导入数据</div>
              <div className="text-xs text-muted-foreground">从 JSON 备份文件恢复</div>
            </div>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="pt-3 border-t">
            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-sm font-medium">清空所有数据</div>
                  <div className="text-xs opacity-70">此操作不可恢复</div>
                </div>
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">确定要清空所有数据吗？此操作无法恢复！</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      onDeleteAll()
                      setShowDeleteConfirm(false)
                      onClose()
                    }}
                  >
                    确认清空
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
