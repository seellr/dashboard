'use client'

import type { ReactNode } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { SettingDefinition } from '@/shared/types/builder'

interface ColumnCountFieldProps {
  definition: SettingDefinition
  form: UseFormReturn<Record<string, unknown>>
  name: string
  label: ReactNode
  help: ReactNode
  onCommit: (fieldName: string, value: unknown) => void
}

/** The builder keeps column counts small; more than six never reads well. */
const MIN_COLUMNS = 1
const MAX_COLUMNS = 6

function columnChoices(definition: SettingDefinition): number[] {
  const optionNumbers = (definition.options ?? [])
    .map((option) => Number(option.value))
    .filter((value) => Number.isInteger(value) && value >= MIN_COLUMNS)

  const min = Math.max(
    MIN_COLUMNS,
    Math.floor(optionNumbers.length ? Math.min(...optionNumbers) : (definition.min ?? MIN_COLUMNS)),
  )
  const max = Math.min(
    MAX_COLUMNS,
    Math.ceil(optionNumbers.length ? Math.max(...optionNumbers) : (definition.max ?? MAX_COLUMNS)),
  )

  if (min > max) return [3]
  return Array.from({ length: max - min + 1 }, (_, index) => min + index)
}

function commitValue(definition: SettingDefinition, value: number): unknown {
  if (definition.type === 'number' || definition.type === 'range') return value
  return String(value)
}

/**
 * Visual replacement for the plain number/select input used by `columns` and
 * `slides_per_view`. Each button previews the layout with tiny column glyphs so
 * the editor shows what the setting actually does.
 */
export function ColumnCountField({
  definition,
  form,
  name,
  label,
  help,
  onCommit,
}: ColumnCountFieldProps) {
  const choices = columnChoices(definition)

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => {
          const current = Number(field.value)
          const active = choices.includes(current) ? current : undefined

          return (
            <div
              id={name}
              role="radiogroup"
              aria-label={typeof label === 'string' ? label : definition.label}
              className="grid grid-cols-3 gap-1.5 rounded-lg border bg-muted/40 p-1.5 sm:grid-cols-6"
            >
              {choices.map((count) => (
                <button
                  key={count}
                  type="button"
                  role="radio"
                  aria-checked={active === count}
                  aria-label={`${count} ${count === 1 ? 'column' : 'columns'}`}
                  title={`${count} ${count === 1 ? 'column' : 'columns'}`}
                  onClick={() => {
                    const value = commitValue(definition, count)
                    field.onChange(value)
                    onCommit(name, value)
                  }}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-md border border-transparent px-1 py-2 text-[11px] font-medium text-muted-foreground transition-all',
                    'hover:border-border hover:bg-background hover:text-foreground',
                    'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-1',
                    active === count && 'border-primary/40 bg-background text-primary shadow-xs ring-1 ring-primary/20',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-5 w-full max-w-9 gap-0.5"
                    style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: count }, (_, index) => (
                      <span
                        key={index}
                        className={cn(
                          'rounded-[2px] border',
                          active === count ? 'border-primary/70 bg-primary/70' : 'border-muted-foreground/30 bg-muted-foreground/10',
                        )}
                      />
                    ))}
                  </span>
                  <span>{count}</span>
                </button>
              ))}
            </div>
          )
        }}
      />
      {help}
    </div>
  )
}
