'use client'

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { HexColorPicker } from 'react-colorful'
import { ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MediaPickerDialog } from '@/components/shared/MediaPickerDialog'
import type { SettingDefinition } from '@/shared/types/builder'
import { buildSettingsSchema, flattenSettings, mergeSettings, settingFieldName } from '@/builder/lib/settings-form'
import { useEditorStore } from '@/builder/store/editor-store'

type FormValues = Record<string, unknown>

export function SettingsPanel() {
  const section = useEditorStore((state) => state.page.sections.find((item) => item.id === state.selectedSectionId))
  const schema = useEditorStore((state) => state.schema)
  const localeTab = useEditorStore((state) => state.localeTab)
  const setLocaleTab = useEditorStore((state) => state.setLocaleTab)
  const update = useEditorStore((state) => state.updateSectionSettings)
  const [mediaField, setMediaField] = useState<string | null>(null)
  const definitionList = useMemo<SettingDefinition[]>(() => schema.sections.find((item) => item.type === section?.type)?.settings ?? [], [schema.sections, section?.type])
  const formSchema = useMemo(() => buildSettingsSchema(definitionList, localeTab), [definitionList, localeTab])
  const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: section ? flattenSettings(section.settings, definitionList, localeTab) : {} })

  useEffect(() => { if (section) form.reset(flattenSettings(section.settings, definitionList, localeTab)) }, [section, definitionList, localeTab, form])
  if (!section) return <aside className="w-80 shrink-0 border-s p-5 text-sm text-muted-foreground">Select a section to edit its settings.</aside>

  const submit = (values: FormValues) => update(section.id, mergeSettings(values, section.settings, definitionList, localeTab))
  return <aside className="w-80 shrink-0 overflow-y-auto border-s p-4"><div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">{section.type}</h2><Tabs value={localeTab} onValueChange={(value) => setLocaleTab(value as 'ar' | 'en')}><TabsList><TabsTrigger value="ar">AR</TabsTrigger><TabsTrigger value="en">EN</TabsTrigger></TabsList></Tabs></div><form className="grid gap-4" onChange={() => void form.handleSubmit(submit)()}>{definitionList.map((definition) => <SettingField key={definition.key} definition={definition} locale={localeTab} form={form} onChooseImage={() => setMediaField(definition.key)} />)}</form><MediaPickerDialog scope="subscriber" open={Boolean(mediaField)} onOpenChange={(open) => { if (!open) setMediaField(null) }} onSelect={(media) => { if (mediaField && !Array.isArray(media)) form.setValue(mediaField, media.url, { shouldDirty: true }); setMediaField(null) }} /></aside>
}

function SettingField({ definition, locale, form, onChooseImage }: { definition: SettingDefinition; locale: 'ar' | 'en'; form: ReturnType<typeof useForm<FormValues>>; onChooseImage: () => void }) {
  const name = settingFieldName(definition, locale)
  const label = definition.label[locale]
  if (definition.type === 'toggle') return <div className="flex items-center justify-between gap-3"><Label htmlFor={name}>{label}</Label><Controller control={form.control} name={name} render={({ field }) => <Switch id={name} checked={Boolean(field.value)} onCheckedChange={field.onChange} />} /></div>
  if (definition.type === 'color') return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Controller control={form.control} name={name} render={({ field }) => <div className="grid gap-2"><HexColorPicker color={typeof field.value === 'string' ? field.value : '#000000'} onChange={field.onChange} /><Input id={name} value={typeof field.value === 'string' ? field.value : ''} onChange={field.onChange} placeholder="#000000" /></div>} /></div>
  if (definition.type === 'select' || definition.type === 'font') return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Controller control={form.control} name={name} render={({ field }) => <Select value={typeof field.value === 'string' ? field.value : ''} onValueChange={field.onChange}><SelectTrigger id={name} className="w-full"><SelectValue placeholder={label} /></SelectTrigger><SelectContent>{(definition.options ?? []).map((option) => <SelectItem key={option.value} value={option.value}>{option.label[locale]}</SelectItem>)}</SelectContent></Select>} /></div>
  if (definition.type === 'image') return <div className="grid gap-2"><Label>{label}</Label><Button type="button" variant="outline" onClick={onChooseImage} className="justify-start gap-2"><ImageIcon className="size-4" />Choose image</Button></div>
  return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} {...form.register(name)} /></div>
}
