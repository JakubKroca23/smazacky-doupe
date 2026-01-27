'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const BACKGROUND_COLORS = [
  { name: 'Modrá', value: 'bg-blue-500' },
  { name: 'Červená', value: 'bg-red-500' },
  { name: 'Zelená', value: 'bg-green-500' },
  { name: 'Žlutá', value: 'bg-yellow-500' },
  { name: 'Fialová', value: 'bg-purple-500' },
  { name: 'Růžová', value: 'bg-pink-500' },
  { name: 'Oranžová', value: 'bg-orange-500' },
  { name: 'Tyrkysová', value: 'bg-cyan-500' },
]

const BORDER_STYLES = [
  { name: 'Žádný', value: 'none' },
  { name: 'Pevný', value: 'solid' },
  { name: 'Tečkovaný', value: 'dashed' },
  { name: 'Tlustý', value: 'double' },
]

const BORDER_COLORS = [
  { name: 'Zlatá', value: 'border-yellow-400' },
  { name: 'Stříbrná', value: 'border-gray-400' },
  { name: 'Bronzová', value: 'border-orange-700' },
  { name: 'Diamant', value: 'border-blue-300' },
  { name: 'Rubín', value: 'border-red-500' },
  { name: 'Smaragd', value: 'border-green-500' },
]

interface CharacterCustomizerProps {
  customization: {
    backgroundColor?: string
    borderStyle?: string
    borderColor?: string
  }
  onChange: (customization: {
    backgroundColor?: string
    borderStyle?: string
    borderColor?: string
  }) => void
}

export function CharacterCustomizer({ customization, onChange }: CharacterCustomizerProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Barva pozadí</Label>
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUND_COLORS.map((color) => (
            <Button
              key={color.value}
              type="button"
              variant={customization.backgroundColor === color.value ? 'default' : 'outline'}
              className="h-10"
              onClick={() => onChange({ ...customization, backgroundColor: color.value })}
            >
              <div className={`w-4 h-4 rounded-full ${color.value} mr-2`} />
              {color.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Styl okraje</Label>
        <div className="grid grid-cols-2 gap-2">
          {BORDER_STYLES.map((style) => (
            <Button
              key={style.value}
              type="button"
              variant={customization.borderStyle === style.value ? 'default' : 'outline'}
              onClick={() => onChange({ ...customization, borderStyle: style.value })}
            >
              {style.name}
            </Button>
          ))}
        </div>
      </div>

      {customization.borderStyle && customization.borderStyle !== 'none' && (
        <div className="space-y-3">
          <Label>Barva okraje</Label>
          <div className="grid grid-cols-3 gap-2">
            {BORDER_COLORS.map((color) => (
              <Button
                key={color.value}
                type="button"
                variant={customization.borderColor === color.value ? 'default' : 'outline'}
                className="h-10"
                onClick={() => onChange({ ...customization, borderColor: color.value })}
              >
                {color.name}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
