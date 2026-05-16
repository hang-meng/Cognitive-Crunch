import { useState, useRef, useEffect } from 'react'
import { searchFood, FoodItem } from '@/lib/store'
import { Search, X, ChevronDown } from 'lucide-react'

interface FoodSearchProps {
  onSelect: (food: FoodItem, quantity: number) => void
}

export function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FoodItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [quantity, setQuantity] = useState('100')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setResults(searchFood(query))
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food)
    setQuery(food.name)
    setIsOpen(false)
  }

  const handleConfirm = () => {
    if (selectedFood) {
      const qty = parseInt(quantity) || 100
      onSelect(selectedFood, qty)
      setSelectedFood(null)
      setQuery('')
      setQuantity('100')
    }
  }

  const categories = [...new Set(searchFood('').map((f) => f.category))]

  return (
    <div ref={containerRef} className="relative">
      <label className="text-sm font-medium">搜索食物</label>
      <div className="relative mt-1.5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setSelectedFood(null) }}
          onFocus={() => setIsOpen(true)}
          placeholder="搜索食物名称，如: 鸡胸肉"
          className="w-full pl-10 pr-8 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-diet/30"
        />
        {query && (
          <button onClick={() => { setQuery(''); setSelectedFood(null) }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {isOpen && !selectedFood && results.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-card border rounded-xl shadow-lg max-h-64 overflow-auto animate-scale-in">
          {results.map((food, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelectFood(food)}
              className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center justify-between"
            >
              <div>
                <span className="text-sm">{food.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{food.unit}</span>
              </div>
              <span className="text-sm font-medium text-diet">{food.calories} kcal</span>
            </button>
          ))}
        </div>
      )}

      {selectedFood && (
        <div className="mt-2 p-3 rounded-lg bg-diet-light border border-diet/20 space-y-2 animate-scale-in">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{selectedFood.name}</span>
            <span className="text-xs text-diet">{selectedFood.calories} kcal/{selectedFood.unit}</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">份量(g):</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-24 px-2 py-1 rounded border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-diet/30"
            />
            <Button size="sm" variant="diet" onClick={handleConfirm} className="ml-auto">
              确认
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            蛋白质 {selectedFood.protein}g | 碳水 {selectedFood.carbs}g | 脂肪 {selectedFood.fat}g (每{selectedFood.unit})
          </div>
        </div>
      )}
    </div>
  )
}

// Re-export Button so it's available
import { Button } from '@/components/ui/button'
