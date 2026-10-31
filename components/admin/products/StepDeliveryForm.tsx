'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import {
  Package,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  AlertCircle,
  CheckCircle2,
  Check,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ProductDeliverySchema,
  AssetTypeLabels,
  AssetTypeValues,
  type ProductDeliveryInput,
  type ProductAssetInput,
  type Product,
} from '@/types/dto/product.dto'
import {
  updateProductDelivery,
  createProductAsset,
  deleteProductAsset,
  setFormApiErrors,
} from '@/lib/admin/products-client'

interface StepDeliveryFormProps {
  ulid: string
  product: Product | null
  onSuccess: () => void
  onBack?: () => void
}

export function StepDeliveryForm({
  ulid,
  product,
  onSuccess,
  onBack,
}: StepDeliveryFormProps) {
  const t = useTranslations('admin.products')
  const [serverError, setServerError] = useState<string | null>(null)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Assets state
  const [assets, setAssets] = useState<any[]>(product?.assets ?? [])
  const [showAddAsset, setShowAddAsset] = useState(false)
  const [newAsset, setNewAsset] = useState<ProductAssetInput>({
    name: '',
    asset_type: 1,
    url: '',
    prompt_text: '',
    prompt_category: '',
  })
  const [assetLoading, setAssetLoading] = useState(false)

  const deliveryMethod = product?.delivery_method?.id ?? 1
  const deliveryConfig = product?.delivery_config as Record<string, any> | undefined

  const defaultValues: ProductDeliveryInput = {
    external_url: deliveryConfig?.external_url ?? '',
    notion_url: deliveryConfig?.notion_url ?? '',
    discord_server_id: deliveryConfig?.discord_server_id ?? '',
    discord_role_id: deliveryConfig?.discord_role_id ?? '',
    discord_bot_token: deliveryConfig?.discord_bot_token ?? '',
    telegram_invite: deliveryConfig?.telegram_invite ?? '',
    calendly_url: deliveryConfig?.calendly_url ?? '',
    requires_shipping: deliveryConfig?.requires_shipping ?? (deliveryMethod === 8),
    download_limit: deliveryConfig?.download_limit ?? product?.download_limit ?? null,
    access_expiry_days: deliveryConfig?.access_expiry_days ?? product?.access_expiry_days ?? null,
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductDeliveryInput>({
    resolver: zodResolver(ProductDeliverySchema),
    defaultValues,
  })

  const requiresShipping = watch('requires_shipping')

  const onSubmit = async (data: ProductDeliveryInput) => {
    setServerError(null)
    setSavedSuccess(false)

    const payload: ProductDeliveryInput = {
      ...data,
      download_limit: data.download_limit ? Number(data.download_limit) : null,
      access_expiry_days: data.access_expiry_days ? Number(data.access_expiry_days) : null,
    }

    const res = await updateProductDelivery(ulid, payload)
    if (res.ok) {
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
      onSuccess()
    } else {
      if (res.status === 422 && res.errors) {
        setFormApiErrors(res.errors, setError)
      }
      setServerError(res.message || 'Failed to update delivery settings')
    }
  }

  const handleAddAsset = async () => {
    if (!newAsset.name?.trim()) return
    setAssetLoading(true)

    const res = await createProductAsset(ulid, newAsset)
    if (res.ok) {
      setAssets((prev) => [...prev, { ...newAsset, id: Date.now() }])
      setNewAsset({ name: '', asset_type: 1, url: '', prompt_text: '', prompt_category: '' })
      setShowAddAsset(false)
    }
    setAssetLoading(false)
  }

  const handleDeleteAsset = async (assetId: string | number) => {
    const res = await deleteProductAsset(ulid, assetId)
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== assetId))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {serverError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Delivery configuration saved successfully!</span>
        </div>
      )}

      {/* Dynamic Fields According to Delivery Method */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Package className="size-4 text-primary" />
              Delivery Method: {product?.delivery_method?.label ?? 'File Download'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Only fields relevant to this delivery method are requested.
            </p>
          </div>
        </div>

        {/* 1: File Download */}
        {deliveryMethod === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dl-limit" className="text-xs font-medium">
                Download Limit per Customer
              </Label>
              <Input
                id="dl-limit"
                type="number"
                min="1"
                max="1000"
                {...register('download_limit', { valueAsNumber: true })}
                placeholder="Unlimited (empty)"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dl-expiry" className="text-xs font-medium">
                Access Expiry (Days)
              </Label>
              <Input
                id="dl-expiry"
                type="number"
                min="1"
                max="3650"
                {...register('access_expiry_days', { valueAsNumber: true })}
                placeholder="Lifetime (empty)"
              />
            </div>
          </div>
        )}

        {/* 2 & 4: External Link or Interactive Tool */}
        {(deliveryMethod === 2 || deliveryMethod === 4) && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="external_url" className="text-xs font-medium">
              External Destination / Stream URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="external_url"
              {...register('external_url')}
              placeholder="https://example.com/access-portal"
              className={errors.external_url ? 'border-destructive' : ''}
            />
            {errors.external_url && (
              <p className="text-xs text-destructive">{errors.external_url.message}</p>
            )}
          </div>
        )}

        {/* 3: Notion Link */}
        {deliveryMethod === 3 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notion_url" className="text-xs font-medium">
              Notion Template / Page Share URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="notion_url"
              {...register('notion_url')}
              placeholder="https://notion.so/..."
              className={errors.notion_url ? 'border-destructive' : ''}
            />
            {errors.notion_url && (
              <p className="text-xs text-destructive">{errors.notion_url.message}</p>
            )}
          </div>
        )}

        {/* 5: Discord Access */}
        {deliveryMethod === 5 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discord_server_id" className="text-xs font-medium">
                Discord Server ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discord_server_id"
                {...register('discord_server_id')}
                placeholder="e.g. 104234567890123456"
                className={errors.discord_server_id ? 'border-destructive' : ''}
              />
              {errors.discord_server_id && (
                <p className="text-xs text-destructive">{errors.discord_server_id.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discord_role_id" className="text-xs font-medium">
                Discord Role ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="discord_role_id"
                {...register('discord_role_id')}
                placeholder="e.g. 104234567890123457"
                className={errors.discord_role_id ? 'border-destructive' : ''}
              />
              {errors.discord_role_id && (
                <p className="text-xs text-destructive">{errors.discord_role_id.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="discord_bot_token" className="text-xs font-medium">
                Bot Token (Optional)
              </Label>
              <Input
                id="discord_bot_token"
                type="password"
                {...register('discord_bot_token')}
                placeholder="Secret bot token"
              />
            </div>
          </div>
        )}

        {/* 6: Telegram Access */}
        {deliveryMethod === 6 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="telegram_invite" className="text-xs font-medium">
              Telegram Group / Channel Invite Link <span className="text-destructive">*</span>
            </Label>
            <Input
              id="telegram_invite"
              {...register('telegram_invite')}
              placeholder="https://t.me/+joinchat..."
              className={errors.telegram_invite ? 'border-destructive' : ''}
            />
            {errors.telegram_invite && (
              <p className="text-xs text-destructive">{errors.telegram_invite.message}</p>
            )}
          </div>
        )}

        {/* 7: Calendly Link */}
        {deliveryMethod === 7 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="calendly_url" className="text-xs font-medium">
              Calendly Booking URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="calendly_url"
              {...register('calendly_url')}
              placeholder="https://calendly.com/your-brand/consultation"
              className={errors.calendly_url ? 'border-destructive' : ''}
            />
            {errors.calendly_url && (
              <p className="text-xs text-destructive">{errors.calendly_url.message}</p>
            )}
          </div>
        )}

        {/* 8: Physical Product */}
        {deliveryMethod === 8 && (
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
            <div>
              <Label htmlFor="requires_shipping" className="text-xs font-medium cursor-pointer">
                Requires Shipping Address
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Customer must provide physical shipping address at checkout.
              </p>
            </div>
            <Switch
              id="requires_shipping"
              checked={requiresShipping ?? true}
              onCheckedChange={(val) => setValue('requires_shipping', val)}
            />
          </div>
        )}
      </div>

      {/* Downloadable / Attached Assets Section */}
      <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Attached Assets & Files</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage downloadable files, notion templates, or prompt packs delivered to the buyer.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddAsset((prev) => !prev)}
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" />
            Add Asset
          </Button>
        </div>

        {/* Add Asset Form */}
        {showAddAsset && (
          <div className="p-4 rounded-xl border bg-muted/30 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Asset Name</Label>
                <Input
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  placeholder="e.g. Master Notion Dashboard"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Asset Type</Label>
                <Select
                  value={String(newAsset.asset_type)}
                  onValueChange={(val) => setNewAsset({ ...newAsset, asset_type: Number(val) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AssetTypeValues.map((val) => (
                      <SelectItem key={val} value={String(val)}>
                        {AssetTypeLabels[val]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">URL / Destination</Label>
              <Input
                value={newAsset.url ?? ''}
                onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            {newAsset.asset_type === 4 && (
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Prompt Content</Label>
                <Input
                  value={newAsset.prompt_text ?? ''}
                  onChange={(e) => setNewAsset({ ...newAsset, prompt_text: e.target.value })}
                  placeholder="Enter prompt instructions"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddAsset(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddAsset}
                disabled={assetLoading || !newAsset.name}
              >
                Save Asset
              </Button>
            </div>
          </div>
        )}

        {/* Existing Assets List */}
        {assets.length === 0 ? (
          <p className="text-xs text-muted-foreground py-3 text-center">
            No assets attached to this product yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-background"
              >
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-primary" />
                  <div>
                    <p className="text-xs font-medium">{asset.name}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {AssetTypeLabels[asset.asset_type as number] || 'Asset'}
                      {asset.url ? ` • ${asset.url}` : ''}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDeleteAsset(asset.id)}
                  title="Remove asset"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onBack ? (
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            {t('wizard.back')}
          </Button>
        ) : <div />}

        <Button type="submit" size="sm" disabled={isSubmitting}>
          {isSubmitting ? t('wizard.saving') : t('wizard.saveAndContinue')}
        </Button>
      </div>
    </form>
  )
}
