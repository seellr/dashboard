'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  FileText,
  AlignLeft,
  Image as ImageIcon,
  Package,
  Layers,
  GitFork,
  CheckCircle2,
  X,
  Check,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { StepBasicsForm } from './StepBasicsForm'
import { StepDescriptionForm } from './StepDescriptionForm'
import { StepImagesForm } from './StepImagesForm'
import { StepDeliveryForm } from './StepDeliveryForm'
import { StepExtrasForm } from './StepExtrasForm'
import { StepFunnelForm } from './StepFunnelForm'
import { StepReviewPublish } from './StepReviewPublish'
import { useProductQuery } from '@/hooks/queries/useProducts'
import type { Product } from '@/types/dto/product.dto'

export interface ProductWizardDialogProps {
  ulid: string | null // 'new' or null for create flow, or a 26-char ULID for edit flow
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const WIZARD_STEPS = [
  { id: 1, key: 'step1', icon: FileText },
  { id: 2, key: 'step2', icon: AlignLeft },
  { id: 3, key: 'step3', icon: ImageIcon },
  { id: 4, key: 'step4', icon: Package },
  { id: 5, key: 'step5', icon: Layers },
  { id: 6, key: 'step6', icon: GitFork },
  { id: 7, key: 'step7', icon: CheckCircle2 },
] as const

export function ProductWizardDialog({
  ulid,
  open,
  onOpenChange,
  onSuccess,
}: ProductWizardDialogProps) {
  const t = useTranslations('admin.products')
  const [currentStep, setCurrentStep] = useState<number>(1)
  const [activeUlid, setActiveUlid] = useState<string | null>(ulid && ulid !== 'new' ? ulid : null)

  const { data: loadedProduct, refetch } = useProductQuery(activeUlid)

  useEffect(() => {
    if (ulid && ulid !== 'new') {
      setActiveUlid(ulid)
    } else {
      setActiveUlid(null)
      setCurrentStep(1)
    }
  }, [ulid, open])

  const handleStep1Success = (createdUlid: string, updatedProduct?: Product) => {
    setActiveUlid(createdUlid)
    setCurrentStep(2)
    refetch()
  }

  const handleStepSuccess = (nextStep: number) => {
    refetch()
    if (nextStep <= 7) {
      setCurrentStep(nextStep)
    } else {
      onSuccess?.()
      onOpenChange(false)
    }
  }

  const handleFinish = () => {
    onSuccess?.()
    onOpenChange(false)
  }

  const canNavigateToStep = (stepNumber: number) => {
    if (stepNumber === 1) return true
    return Boolean(activeUlid)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[92vw] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[92vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b pb-4 text-start flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              {activeUlid ? (
                <>
                  <span>Edit Product:</span>
                  <span className="text-primary font-mono">{loadedProduct?.name || loadedProduct?.internal_name || activeUlid}</span>
                </>
              ) : (
                <span>{t('new')} (Product Wizard)</span>
              )}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t(`wizard.step${currentStep}Desc` as any)}
            </p>
          </div>
        </DialogHeader>

        {/* Stepper Header Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto py-3 border-b bg-muted/20 px-2 rounded-lg">
          {WIZARD_STEPS.map((step) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isClickable = canNavigateToStep(step.id)
            const isCompleted = activeUlid && currentStep > step.id

            return (
              <button
                key={step.id}
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : isCompleted
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : isClickable
                      ? 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      : 'text-muted-foreground/40'
                  }`}
              >
                <div className="size-4 rounded-full flex items-center justify-center text-[10px]">
                  {isCompleted ? <Check className="size-3" /> : step.id}
                </div>
                <span>{t(`wizard.${step.key}` as any)}</span>
              </button>
            )
          })}
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto py-4 px-1">
          {currentStep === 1 && (
            <StepBasicsForm
              product={loadedProduct ?? null}
              onSuccess={handleStep1Success}
              onCancel={() => onOpenChange(false)}
            />
          )}

          {currentStep === 2 && activeUlid && (
            <StepDescriptionForm
              ulid={activeUlid}
              product={loadedProduct ?? null}
              onSuccess={() => handleStepSuccess(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && activeUlid && (
            <StepImagesForm
              ulid={activeUlid}
              product={loadedProduct ?? null}
              onSuccess={() => handleStepSuccess(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && activeUlid && (
            <StepDeliveryForm
              ulid={activeUlid}
              product={loadedProduct ?? null}
              onSuccess={() => handleStepSuccess(5)}
              onBack={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 5 && activeUlid && (
            <StepExtrasForm
              ulid={activeUlid}
              product={loadedProduct ?? null}
              onSuccess={() => handleStepSuccess(6)}
              onBack={() => setCurrentStep(4)}
            />
          )}

          {currentStep === 6 && activeUlid && (
            <StepFunnelForm
              ulid={activeUlid}
              product={loadedProduct ?? null}
              onSuccess={() => handleStepSuccess(7)}
              onBack={() => setCurrentStep(5)}
            />
          )}

          {currentStep === 7 && activeUlid && (
            <StepReviewPublish
              ulid={activeUlid}
              product={loadedProduct ?? null}
              onComplete={handleFinish}
              onBack={() => setCurrentStep(6)}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
