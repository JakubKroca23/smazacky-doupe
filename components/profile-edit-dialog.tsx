'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvatarSelector } from '@/components/avatar-selector'
import { CharacterCustomizer } from '@/components/character-customizer'
import { updateDisplayName, updateAvatarIcon, updateAvatarCustomization } from '@/app/actions/profile'
import { Settings } from 'lucide-react'

interface ProfileEditDialogProps {
  currentDisplayName: string
  currentIcon: string
  currentCustomization: {
    backgroundColor?: string
    borderStyle?: string
    borderColor?: string
  }
}

export function ProfileEditDialog({
  currentDisplayName,
  currentIcon,
  currentCustomization,
}: ProfileEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [selectedIcon, setSelectedIcon] = useState(currentIcon)
  const [customization, setCustomization] = useState(currentCustomization)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    
    await updateDisplayName(displayName)
    await updateAvatarIcon(selectedIcon)
    await updateAvatarCustomization(customization)
    
    setLoading(false)
    setOpen(false)
  }

  const getBorderClass = () => {
    if (!customization.borderStyle || customization.borderStyle === 'none') return ''
    const width = customization.borderStyle === 'double' ? 'border-4' : 'border-2'
    const style = customization.borderStyle === 'dashed' ? 'border-dashed' : 'border-solid'
    return `${width} ${style} ${customization.borderColor || 'border-gray-400'}`
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Upravit profil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upravit profil</DialogTitle>
          <DialogDescription>
            Změň své jméno, ikonu a přizpůsob si svou postavu
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="name" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="name">Jméno</TabsTrigger>
            <TabsTrigger value="icon">Ikona</TabsTrigger>
            <TabsTrigger value="character">Postava</TabsTrigger>
          </TabsList>

          <TabsContent value="name" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Zobrazované jméno</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tvoje přezdívka"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Maximálně 20 znaků
              </p>
            </div>
          </TabsContent>

          <TabsContent value="icon" className="space-y-4">
            <div className="flex justify-center mb-4">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl ${
                  customization.backgroundColor || 'bg-primary'
                } ${getBorderClass()}`}
              >
                {selectedIcon}
              </div>
            </div>
            <AvatarSelector selectedIcon={selectedIcon} onSelect={setSelectedIcon} />
          </TabsContent>

          <TabsContent value="character" className="space-y-4">
            <div className="flex justify-center mb-4">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl ${
                  customization.backgroundColor || 'bg-primary'
                } ${getBorderClass()}`}
              >
                {selectedIcon}
              </div>
            </div>
            <CharacterCustomizer customization={customization} onChange={setCustomization} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Zrušit
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Ukládání...' : 'Uložit změny'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
