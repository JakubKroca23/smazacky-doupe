'use client'

import { Button } from '@/components/ui/button'

const AVATAR_ICONS = [
  '🎮', '🕹️', '👾', '🎯', '🔥', '⚡', '⭐', '💎',
  '🏆', '👑', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧',
  '🚀', '🛸', '🌟', '💫', '✨', '🌈', '🦄', '🐉',
  '🦊', '🐺', '🦁', '🐯', '🐻', '🐼', '🐨', '🐸',
  '🤖', '👽', '👹', '👺', '💀', '🎃', '😎', '🤩',
]

interface AvatarSelectorProps {
  selectedIcon: string
  onSelect: (icon: string) => void
}

export function AvatarSelector({ selectedIcon, onSelect }: AvatarSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">Vyber svou ikonu</div>
      <div className="grid grid-cols-8 gap-2">
        {AVATAR_ICONS.map((icon) => (
          <Button
            key={icon}
            type="button"
            variant={selectedIcon === icon ? 'default' : 'outline'}
            className="text-2xl h-12 w-12 p-0"
            onClick={() => onSelect(icon)}
          >
            {icon}
          </Button>
        ))}
      </div>
    </div>
  )
}
