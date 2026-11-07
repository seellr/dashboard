'use client'
/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  addSellerBundleItem,
  addSellerProductFaq,
  addSellerProductTestimonial,
  deleteSellerBundleItem,
  deleteSellerProduct,
  deleteSellerProductFaq,
  deleteSellerProductImage,
  deleteSellerProductTestimonial,
  getSellerProduct,
  listSellerProducts,
  saveSellerProductDelivery,
  saveSellerProductDescription,
  saveSellerProductFunnel,
  saveSellerProductSeo,
  updateSellerProduct,
  uploadSellerProductHero,
  uploadSellerProductImage,
  createSellerProduct,
  type SellerProduct,
} from '@/lib/seller/resource-client'

const PRODUCT_TYPES = [
  ['Ebook', 'كتاب إلكتروني'], ['Template', 'قالب'], ['Playbook', 'دليل عملي'],
  ['Notion System', 'نظام نوشن'], ['Prompts Pack', 'حزمة برومبتات'], ['Bundle', 'حزمة منتجات'],
  ['Course', 'دورة'], ['AI Tool', 'أداة ذكاء اصطناعي'], ['Quiz', 'اختبار'], ['Audio', 'ملف صوتي'],
  ['Membership', 'عضوية'], ['Challenge', 'تحدي'], ['Consultation', 'استشارة'],
] as const

const DELIVERY_METHODS = [
  ['File download', 'تنزيل ملف'], ['External link', 'رابط خارجي'], ['Notion link', 'رابط نوشن'],
  ['Interactive', 'تفاعلي'], ['Discord', 'ديسكورد'], ['Telegram', 'تيليجرام'], ['Calendly', 'كالندلي'], ['Physical', 'منتج مادي'],
] as const

const STEPS = ['basics', 'description', 'media', 'delivery', 'extras', 'funnel', 'review'] as const

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function textAt(value: unknown, ...path: string[]): string {
  let current: unknown = value
  for (const key of path) {
    current = asRecord(current)[key]
  }
  return typeof current === 'string' ? current : ''
}

function enumId(value: unknown, fallback: number): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  const id = asRecord(value).id
  if (typeof id === 'number') return id
  if (typeof id === 'string' && /^\d+$/.test(id)) return Number(id)
  return fallback
}

function optionLabel(options: readonly (readonly [string, string])[], id: number, locale: string) {
  const option = options[id - 1]
  return option ? option[locale === 'ar' ? 1 : 0] : '—'
}

export function ProductWizard({ initialUlid }: { initialUlid?: string }) {
  const t = useTranslations('seller.products.wizard')
  const locale = useLocale()
  const router = useRouter()
  const [product, setProduct] = useState<SellerProduct | null>(null)
  const [step, setStep] = useState(initialUlid ? 0 : 0)
  const [loading, setLoading] = useState(Boolean(initialUlid))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [internalName, setInternalName] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [oneLinerAr, setOneLinerAr] = useState('')
  const [type, setType] = useState('1')
  const [deliveryMethod, setDeliveryMethod] = useState('1')
  const [basePrice, setBasePrice] = useState('0')
  const [salePrice, setSalePrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [vatRule, setVatRule] = useState('3')

  const [oneLiner, setOneLiner] = useState('')
  const [audience, setAudience] = useState('')
  const [painPoint, setPainPoint] = useState('')
  const [outcome, setOutcome] = useState('')
  const [fullDescription, setFullDescription] = useState('')
  const [whatYouGet, setWhatYouGet] = useState('')
  const [refundPolicy, setRefundPolicy] = useState('')

  const [externalUrl, setExternalUrl] = useState('')
  const [notionUrl, setNotionUrl] = useState('')
  const [discordServer, setDiscordServer] = useState('')
  const [discordRole, setDiscordRole] = useState('')
  const [telegramInvite, setTelegramInvite] = useState('')
  const [calendlyUrl, setCalendlyUrl] = useState('')
  const [requiresShipping, setRequiresShipping] = useState(false)
  const [downloadLimit, setDownloadLimit] = useState('')
  const [accessExpiry, setAccessExpiry] = useState('')

  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [faqQuestion, setFaqQuestion] = useState('')
  const [faqAnswer, setFaqAnswer] = useState('')
  const [testimonialName, setTestimonialName] = useState('')
  const [testimonialBody, setTestimonialBody] = useState('')
  const [bundleUlid, setBundleUlid] = useState('')
  const [bundleOptions, setBundleOptions] = useState<SellerProduct[]>([])

  const [tripwire, setTripwire] = useState('')
  const [tripwirePrice, setTripwirePrice] = useState('')
  const [bump, setBump] = useState('')
  const [bumpPrice, setBumpPrice] = useState('')
  const [oto, setOto] = useState('')
  const [otoPrice, setOtoPrice] = useState('')
  const [otoOriginal, setOtoOriginal] = useState('')
  const [otoTimer, setOtoTimer] = useState('')
  const [downsell, setDownsell] = useState('')
  const [downsellPrice, setDownsellPrice] = useState('')
  const [premiumBridge, setPremiumBridge] = useState('')
  const [premiumThreshold, setPremiumThreshold] = useState('')

  const productTypeId = product ? enumId(product.type, 1) : Number(type)

  const hydrate = useCallback((item: SellerProduct) => {
    setProduct(item)
    setInternalName(item.internal_name ?? item.name ?? '')
    const translations = asRecord(asRecord(item as unknown).translations)
    setNameAr(textAt(translations, 'ar', 'name'))
    setNameEn(textAt(translations, 'en', 'name'))
    setOneLinerAr(textAt(translations, 'ar', 'one_liner'))
    setType(String(enumId(item.type, 1)))
    setDeliveryMethod(String(enumId(item.delivery_method, 1)))
    setBasePrice(String(item.base_price ?? 0))
    setSalePrice(item.sale_price === null || item.sale_price === undefined ? '' : String(item.sale_price))
    setCurrency(item.currency ?? 'USD')

    const description = asRecord(item.description)
    setOneLiner(textAt(description, 'translations', 'ar', 'one_liner'))
    setAudience(textAt(description, 'translations', 'ar', 'target_audience'))
    setPainPoint(textAt(description, 'translations', 'ar', 'pain_point'))
    setOutcome(textAt(description, 'translations', 'ar', 'outcome'))
    setFullDescription(textAt(description, 'translations', 'ar', 'full_description'))
    setWhatYouGet(textAt(description, 'translations', 'ar', 'what_you_get'))
    setRefundPolicy(textAt(description, 'translations', 'ar', 'refund_policy'))

    const delivery = asRecord(item.delivery_config)
    setExternalUrl(textAt(delivery, 'external_url'))
    setNotionUrl(textAt(delivery, 'notion_url'))
    setDiscordServer(textAt(delivery, 'discord_server_id'))
    setDiscordRole(textAt(delivery, 'discord_role_id'))
    setTelegramInvite(textAt(delivery, 'telegram_invite'))
    setCalendlyUrl(textAt(delivery, 'calendly_url'))
    setRequiresShipping(delivery.requires_shipping === true)
    setDownloadLimit(delivery.download_limit ? String(delivery.download_limit) : '')
    setAccessExpiry(delivery.access_expiry_days ? String(delivery.access_expiry_days) : '')

    const seo = asRecord(item.seo_meta)
    setMetaTitle(textAt(seo, 'translations', 'ar', 'meta_title'))
    setMetaDescription(textAt(seo, 'translations', 'ar', 'meta_description'))

    const funnel = asRecord(item.funnel_config)
    setTripwire(textAt(funnel, 'tripwire_ulid'))
    setTripwirePrice(funnel.tripwire_price ? String(funnel.tripwire_price) : '')
    setBump(textAt(funnel, 'bump_ulid'))
    setBumpPrice(funnel.bump_price ? String(funnel.bump_price) : '')
    setOto(textAt(funnel, 'oto_ulid'))
    setOtoPrice(funnel.oto_price ? String(funnel.oto_price) : '')
    setOtoOriginal(funnel.oto_original_price ? String(funnel.oto_original_price) : '')
    setOtoTimer(funnel.oto_timer_minutes ? String(funnel.oto_timer_minutes) : '')
    setDownsell(textAt(funnel, 'downsell_ulid'))
    setDownsellPrice(funnel.downsell_price ? String(funnel.downsell_price) : '')
    setPremiumBridge(textAt(funnel, 'premium_bridge_ulid'))
    setPremiumThreshold(
      funnel.premium_score_threshold ? String(funnel.premium_score_threshold) : '',
    )
  }, [])

  const reload = useCallback(async () => {
    if (!initialUlid) return
    setLoading(true)
    const result = await getSellerProduct(initialUlid)
    setLoading(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    hydrate(result.data)
  }, [hydrate, initialUlid])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [reload])

  useEffect(() => {
    if (step !== 4 || productTypeId !== 6) return
    const timer = window.setTimeout(() => {
      void listSellerProducts('?per_page=100&type=6').then((result) => {
        if (result.ok) {
          setBundleOptions(
            result.data.items.filter((item) => item.ulid !== product?.ulid),
          )
        }
      })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [product?.ulid, productTypeId, step])

  const saveBasics = async (event: FormEvent) => {
    event.preventDefault()
    if (Number(salePrice) && Number(salePrice) >= Number(basePrice)) {
      setMessage(t('salePriceInvalid'))
      return
    }
    setSaving(true)
    setMessage('')
    const body = {
      internal_name: internalName.trim(),
      type: Number(type),
      delivery_method: Number(deliveryMethod),
      base_price: Number(basePrice),
      sale_price: salePrice === '' ? null : Number(salePrice),
      currency: currency.toUpperCase(),
      vat_rule: Number(vatRule),
      translations: {
        ar: { name: nameAr.trim() || internalName.trim(), one_liner: oneLinerAr || null },
        en: { name: nameEn.trim() || internalName.trim(), one_liner: null },
      },
    }
    const result = product
      ? await updateSellerProduct(product.ulid, body)
      : await createSellerProduct(body)
    setSaving(false)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    setProduct(result.data)
    if (!product) {
      router.replace(`/${locale}/seller/products/${result.data.ulid}`)
    }
    setStep(1)
  }

  const withSave = async (action: () => Promise<{ ok: boolean; message?: string }>) => {
    setSaving(true)
    setMessage('')
    const result = await action()
    setSaving(false)
    if (!result.ok) {
      setMessage(result.message ?? t('genericError'))
      return false
    }
    return true
  }

  const saveDescription = async () => {
    if (!product) return
    const ok = await withSave(() =>
      saveSellerProductDescription(product.ulid, {
        translations: {
          ar: {
            one_liner: oneLiner || null,
            target_audience: audience || null,
            pain_point: painPoint || null,
            outcome: outcome || null,
            full_description: fullDescription || null,
            what_you_get: whatYouGet || null,
            refund_policy: refundPolicy || null,
          },
        },
      }),
    )
    if (ok) {
      setStep(2)
      await reload()
    }
  }

  const uploadHero = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!product || !file) return
    if (file.size > 4 * 1024 * 1024) {
      setMessage(t('imageTooLarge'))
      return
    }
    const form = new FormData()
    form.append('image', file)
    const ok = await withSave(() => uploadSellerProductHero(product.ulid, form))
    event.target.value = ''
    if (ok) await reload()
  }

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!product || !file) return
    if (file.size > 4 * 1024 * 1024) {
      setMessage(t('imageTooLarge'))
      return
    }
    const form = new FormData()
    form.append('image', file)
    form.append('alt_text', file.name)
    const ok = await withSave(() => uploadSellerProductImage(product.ulid, form))
    event.target.value = ''
    if (ok) await reload()
  }

  const saveDelivery = async () => {
    if (!product) return
    const ok = await withSave(() =>
      saveSellerProductDelivery(product.ulid, {
        external_url: externalUrl || null,
        notion_url: notionUrl || null,
        discord_server_id: discordServer || null,
        discord_role_id: discordRole || null,
        telegram_invite: telegramInvite || null,
        calendly_url: calendlyUrl || null,
        requires_shipping: requiresShipping,
        download_limit: downloadLimit ? Number(downloadLimit) : null,
        access_expiry_days: accessExpiry ? Number(accessExpiry) : null,
      }),
    )
    if (ok) {
      setStep(4)
      await reload()
    }
  }

  const saveSeo = async () => {
    if (!product) return
    const ok = await withSave(() =>
      saveSellerProductSeo(product.ulid, {
        translations: {
          ar: {
            meta_title: metaTitle || null,
            meta_description: metaDescription || null,
          },
        },
      }),
    )
    if (ok) await reload()
  }

  const addFaq = async () => {
    if (!product || !faqQuestion.trim() || !faqAnswer.trim()) return
    const ok = await withSave(() =>
      addSellerProductFaq(product.ulid, {
        translations: {
          ar: { question: faqQuestion.trim(), answer: faqAnswer.trim() },
        },
      }),
    )
    if (ok) {
      setFaqQuestion('')
      setFaqAnswer('')
      await reload()
    }
  }

  const addTestimonial = async () => {
    if (!product || !testimonialName.trim() || !testimonialBody.trim()) return
    const ok = await withSave(() =>
      addSellerProductTestimonial(product.ulid, {
        name: testimonialName.trim(),
        rating: 5,
        translations: { ar: { body: testimonialBody.trim() } },
      }),
    )
    if (ok) {
      setTestimonialName('')
      setTestimonialBody('')
      await reload()
    }
  }

  const addBundle = async () => {
    if (!product || !bundleUlid) return
    if (bundleUlid === product.ulid) {
      setMessage(t('selfBundle'))
      return
    }
    const ok = await withSave(() =>
      addSellerBundleItem(product.ulid, { item_ulid: bundleUlid }),
    )
    if (ok) {
      setBundleUlid('')
      await reload()
    }
  }

  const saveFunnel = async () => {
    if (!product) return
    const ok = await withSave(() =>
      saveSellerProductFunnel(product.ulid, {
        tripwire_ulid: tripwire || null,
        tripwire_price: tripwirePrice ? Number(tripwirePrice) : null,
        bump_ulid: bump || null,
        bump_price: bumpPrice ? Number(bumpPrice) : null,
        oto_ulid: oto || null,
        oto_price: otoPrice ? Number(otoPrice) : null,
        oto_original_price: otoOriginal ? Number(otoOriginal) : null,
        oto_timer_minutes: otoTimer ? Number(otoTimer) : null,
        downsell_ulid: downsell || null,
        downsell_price: downsellPrice ? Number(downsellPrice) : null,
        premium_bridge_ulid: premiumBridge || null,
        premium_score_threshold: premiumThreshold ? Number(premiumThreshold) : null,
      }),
    )
    if (ok) {
      setStep(6)
      await reload()
    }
  }

  const setStatus = async (status: number) => {
    if (!product) return
    const ok = await withSave(() => updateSellerProduct(product.ulid, { status }))
    if (ok) {
      await reload()
      if (status !== 2) router.push(`/${locale}/seller/products`)
    }
  }

  const remove = async () => {
    if (!product || !window.confirm(t('confirmDelete'))) return
    const result = await deleteSellerProduct(product.ulid)
    if (!result.ok) {
      setMessage(result.message)
      return
    }
    router.push(`/${locale}/seller/products`)
  }

  const gallery = useMemo(() => product?.images ?? [], [product?.images])

  if (loading) return <p className="text-sm text-muted-foreground">{t('loading')}</p>

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">
            {product ? t('editTitle') : t('newTitle')}
          </h1>
          {product && (
            <p className="text-xs text-muted-foreground">{product.ulid}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${locale}/seller/products`)}
        >
          {t('back')}
        </Button>
      </div>

      <ol className="flex flex-wrap gap-2 text-sm">
        {STEPS.map((entry, index) => (
          <li key={entry}>
            <button
              type="button"
              onClick={() => {
                if (product || index === 0) setStep(index)
              }}
              disabled={!product && index > 0}
              className={`rounded-full px-3 py-1 ${
                index === step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted disabled:opacity-50'
              }`}
            >
              {index + 1}. {t(`steps.${entry}`)}
            </button>
          </li>
        ))}
      </ol>

      {message && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}

      {step === 0 && (
        <form onSubmit={(event) => void saveBasics(event)} className="grid max-w-2xl gap-3 rounded-lg border p-4">
          <Input value={internalName} onChange={(event) => setInternalName(event.target.value)} placeholder={t('internalName')} aria-label={t('internalName')} maxLength={200} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input value={nameAr} onChange={(event) => setNameAr(event.target.value)} placeholder={t('nameAr')} aria-label={t('nameAr')} maxLength={200} />
            <Input value={nameEn} onChange={(event) => setNameEn(event.target.value)} placeholder={t('nameEn')} aria-label={t('nameEn')} maxLength={200} />
          </div>
          <Input value={oneLinerAr} onChange={(event) => setOneLinerAr(event.target.value)} placeholder={t('oneLinerAr')} aria-label={t('oneLinerAr')} maxLength={300} />
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={type} onChange={(event) => setType(event.target.value)} aria-label={t('type')} className="h-8 rounded-lg border bg-background px-2 text-sm">
              {PRODUCT_TYPES.map(([en, ar], index) => <option key={en} value={index + 1}>{locale === 'ar' ? ar : en}</option>)}
            </select>
            <select value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value)} aria-label={t('deliveryMethod')} className="h-8 rounded-lg border bg-background px-2 text-sm">
              {DELIVERY_METHODS.map(([en, ar], index) => <option key={en} value={index + 1}>{locale === 'ar' ? ar : en}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input type="number" min="0" step="0.01" value={basePrice} onChange={(event) => setBasePrice(event.target.value)} placeholder={t('basePrice')} aria-label={t('basePrice')} required />
            <Input type="number" min="0" step="0.01" value={salePrice} onChange={(event) => setSalePrice(event.target.value)} placeholder={t('salePrice')} aria-label={t('salePrice')} />
            <Input value={currency} onChange={(event) => setCurrency(event.target.value)} maxLength={3} placeholder="USD" aria-label={t('currency')} required />
          </div>
          <select value={vatRule} onChange={(event) => setVatRule(event.target.value)} aria-label={t('vatRule')} className="h-8 rounded-lg border bg-background px-2 text-sm">
            <option value="1">{locale === 'ar' ? 'شامل الضريبة' : 'VAT included'}</option>
            <option value="2">{locale === 'ar' ? 'تضاف الضريبة' : 'VAT added'}</option>
            <option value="3">{locale === 'ar' ? 'معفى من الضريبة' : 'VAT exempt'}</option>
          </select>
          <Button disabled={saving}>{saving ? t('saving') : t('saveContinue')}</Button>
        </form>
      )}

      {step === 1 && product && (
        <div className="grid max-w-2xl gap-3 rounded-lg border p-4">
          <Input value={oneLiner} onChange={(event) => setOneLiner(event.target.value)} placeholder={t('oneLiner')} aria-label={t('oneLiner')} maxLength={300} />
          <Textarea value={audience} onChange={(event) => setAudience(event.target.value)} placeholder={t('audience')} aria-label={t('audience')} maxLength={1000} />
          <Textarea value={painPoint} onChange={(event) => setPainPoint(event.target.value)} placeholder={t('painPoint')} aria-label={t('painPoint')} maxLength={1000} />
          <Textarea value={outcome} onChange={(event) => setOutcome(event.target.value)} placeholder={t('outcome')} aria-label={t('outcome')} maxLength={1000} />
          <Textarea value={fullDescription} onChange={(event) => setFullDescription(event.target.value)} placeholder={t('fullDescription')} aria-label={t('fullDescription')} maxLength={10000} rows={6} />
          <Textarea value={whatYouGet} onChange={(event) => setWhatYouGet(event.target.value)} placeholder={t('whatYouGet')} aria-label={t('whatYouGet')} maxLength={5000} />
          <Textarea value={refundPolicy} onChange={(event) => setRefundPolicy(event.target.value)} placeholder={t('refundPolicy')} aria-label={t('refundPolicy')} maxLength={2000} />
          <Button onClick={() => void saveDescription()} disabled={saving}>{saving ? t('saving') : t('saveContinue')}</Button>
        </div>
      )}

      {step === 2 && product && (
        <div className="grid max-w-3xl gap-4 rounded-lg border p-4">
          <div className="space-y-2">
            <h2 className="font-medium">{t('heroImage')}</h2>
            {product.hero_image_url && <img src={product.hero_image_url} alt="" className="aspect-video w-full max-w-sm rounded-lg object-cover" />}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <Upload className="size-4" aria-hidden="true" />
              {t('uploadHero')}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void uploadHero(event)} />
            </label>
          </div>
          <div className="space-y-2">
            <h2 className="font-medium">{t('gallery')}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {gallery.map((image) => (
                <div key={image.id} className="space-y-1">
                  <img src={image.url} alt={image.alt_text ?? ''} className="aspect-square w-full rounded-lg object-cover" />
                  <Button size="sm" variant="destructive" onClick={() => void withSave(() => deleteSellerProductImage(product.ulid, image.id)).then((ok) => { if (ok) void reload() })}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <Upload className="size-4" aria-hidden="true" />
              {t('uploadImage')}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => void uploadImage(event)} />
            </label>
          </div>
          <Button variant="outline" onClick={() => setStep(3)}>{t('continue')}</Button>
        </div>
      )}

      {step === 3 && product && (
        <div className="grid max-w-2xl gap-3 rounded-lg border p-4">
          <Input value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder={t('externalUrl')} aria-label={t('externalUrl')} />
          <Input value={notionUrl} onChange={(event) => setNotionUrl(event.target.value)} placeholder={t('notionUrl')} aria-label={t('notionUrl')} />
          <Input value={discordServer} onChange={(event) => setDiscordServer(event.target.value.replace(/\D/g, ''))} placeholder={t('discordServer')} aria-label={t('discordServer')} />
          <Input value={discordRole} onChange={(event) => setDiscordRole(event.target.value.replace(/\D/g, ''))} placeholder={t('discordRole')} aria-label={t('discordRole')} />
          <Input value={telegramInvite} onChange={(event) => setTelegramInvite(event.target.value)} placeholder={t('telegramInvite')} aria-label={t('telegramInvite')} />
          <Input value={calendlyUrl} onChange={(event) => setCalendlyUrl(event.target.value)} placeholder={t('calendlyUrl')} aria-label={t('calendlyUrl')} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requiresShipping} onChange={(event) => setRequiresShipping(event.target.checked)} />{t('requiresShipping')}</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input type="number" min="1" max="1000" value={downloadLimit} onChange={(event) => setDownloadLimit(event.target.value)} placeholder={t('downloadLimit')} aria-label={t('downloadLimit')} />
            <Input type="number" min="1" max="3650" value={accessExpiry} onChange={(event) => setAccessExpiry(event.target.value)} placeholder={t('accessExpiry')} aria-label={t('accessExpiry')} />
          </div>
          <Button onClick={() => void saveDelivery()} disabled={saving}>{saving ? t('saving') : t('saveContinue')}</Button>
        </div>
      )}

      {step === 4 && product && (
        <div className="grid max-w-2xl gap-5 rounded-lg border p-4">
          <div className="space-y-2">
            <h2 className="font-medium">{t('seo')}</h2>
            <Input value={metaTitle} onChange={(event) => setMetaTitle(event.target.value)} placeholder={t('metaTitle')} aria-label={t('metaTitle')} maxLength={160} />
            <Textarea value={metaDescription} onChange={(event) => setMetaDescription(event.target.value)} placeholder={t('metaDescription')} aria-label={t('metaDescription')} maxLength={320} />
            <Button size="sm" variant="outline" onClick={() => void saveSeo()} disabled={saving}>{t('saveSeo')}</Button>
          </div>
          <div className="space-y-2">
            <h2 className="font-medium">{t('faqs')}</h2>
            {(product.faqs ?? []).map((faq) => (
              <div key={faq.id} className="flex items-start justify-between gap-2 rounded border p-2 text-sm">
                <span>{faq.question ?? textAt(faq.translations, 'ar', 'question')}</span>
                <Button size="icon" variant="ghost" onClick={() => void withSave(() => deleteSellerProductFaq(product.ulid, faq.id)).then((ok) => { if (ok) void reload() })}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Input value={faqQuestion} onChange={(event) => setFaqQuestion(event.target.value)} placeholder={t('faqQuestion')} aria-label={t('faqQuestion')} maxLength={500} />
            <Textarea value={faqAnswer} onChange={(event) => setFaqAnswer(event.target.value)} placeholder={t('faqAnswer')} aria-label={t('faqAnswer')} maxLength={5000} />
            <Button size="sm" variant="outline" onClick={() => void addFaq()} disabled={saving}>{t('addFaq')}</Button>
          </div>
          <div className="space-y-2">
            <h2 className="font-medium">{t('testimonials')}</h2>
            {(product.testimonials ?? []).map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-2 rounded border p-2 text-sm">
                <span>{item.name}: {item.body ?? textAt(item.translations, 'ar', 'body')}</span>
                <Button size="icon" variant="ghost" onClick={() => void withSave(() => deleteSellerProductTestimonial(product.ulid, item.id)).then((ok) => { if (ok) void reload() })}><Trash2 className="size-4" /></Button>
              </div>
            ))}
            <Input value={testimonialName} onChange={(event) => setTestimonialName(event.target.value)} placeholder={t('testimonialName')} aria-label={t('testimonialName')} maxLength={100} />
            <Textarea value={testimonialBody} onChange={(event) => setTestimonialBody(event.target.value)} placeholder={t('testimonialBody')} aria-label={t('testimonialBody')} maxLength={1000} />
            <Button size="sm" variant="outline" onClick={() => void addTestimonial()} disabled={saving}>{t('addTestimonial')}</Button>
          </div>
          {productTypeId === 6 && (
            <div className="space-y-2">
              <h2 className="font-medium">{t('bundleItems')}</h2>
              {(product.bundle_items ?? []).map((item) => (
                <div key={item.ulid ?? item.item_ulid} className="flex items-center justify-between rounded border p-2 text-sm">
                  <span>{item.name ?? item.item_ulid ?? item.ulid}</span>
                  <Button size="icon" variant="ghost" onClick={() => { const id = item.item_ulid ?? item.ulid; if (id) void withSave(() => deleteSellerBundleItem(product.ulid, id)).then((ok) => { if (ok) void reload() }) }}><Trash2 className="size-4" /></Button>
                </div>
              ))}
              <select value={bundleUlid} onChange={(event) => setBundleUlid(event.target.value)} aria-label={t('bundleItems')} className="h-8 w-full rounded-lg border bg-background px-2 text-sm">
                <option value="">{t('chooseProduct')}</option>
                {bundleOptions.map((option) => <option key={option.ulid} value={option.ulid}>{option.name ?? option.internal_name ?? option.ulid}</option>)}
              </select>
              <Button size="sm" variant="outline" onClick={() => void addBundle()} disabled={saving || !bundleUlid}>{t('addBundle')}</Button>
            </div>
          )}
          <Button onClick={() => setStep(5)}>{t('continue')}</Button>
        </div>
      )}

      {step === 5 && product && (
        <div className="grid max-w-2xl gap-3 rounded-lg border p-4">
          <h2 className="font-medium">{t('funnelTitle')}</h2>
          <Input value={tripwire} onChange={(event) => setTripwire(event.target.value)} placeholder={t('tripwireUlid')} aria-label={t('tripwireUlid')} maxLength={26} />
          <Input type="number" min="0" step="0.01" value={tripwirePrice} onChange={(event) => setTripwirePrice(event.target.value)} placeholder={t('tripwirePrice')} aria-label={t('tripwirePrice')} />
          <Input value={bump} onChange={(event) => setBump(event.target.value)} placeholder={t('bumpUlid')} aria-label={t('bumpUlid')} maxLength={26} />
          <Input type="number" min="0" step="0.01" value={bumpPrice} onChange={(event) => setBumpPrice(event.target.value)} placeholder={t('bumpPrice')} aria-label={t('bumpPrice')} />
          <Input value={oto} onChange={(event) => setOto(event.target.value)} placeholder={t('otoUlid')} aria-label={t('otoUlid')} maxLength={26} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Input type="number" min="0" step="0.01" value={otoPrice} onChange={(event) => setOtoPrice(event.target.value)} placeholder={t('otoPrice')} aria-label={t('otoPrice')} />
            <Input type="number" min="0" step="0.01" value={otoOriginal} onChange={(event) => setOtoOriginal(event.target.value)} placeholder={t('otoOriginal')} aria-label={t('otoOriginal')} />
            <Input type="number" min="1" max="1440" value={otoTimer} onChange={(event) => setOtoTimer(event.target.value)} placeholder={t('otoTimer')} aria-label={t('otoTimer')} />
          </div>
          <Input value={downsell} onChange={(event) => setDownsell(event.target.value)} placeholder={t('downsellUlid')} aria-label={t('downsellUlid')} maxLength={26} />
          <Input type="number" min="0" step="0.01" value={downsellPrice} onChange={(event) => setDownsellPrice(event.target.value)} placeholder={t('downsellPrice')} aria-label={t('downsellPrice')} />
          <Input value={premiumBridge} onChange={(event) => setPremiumBridge(event.target.value)} placeholder={t('premiumBridgeUlid')} aria-label={t('premiumBridgeUlid')} maxLength={26} />
          <Input type="number" min="0" step="0.01" value={premiumThreshold} onChange={(event) => setPremiumThreshold(event.target.value)} placeholder={t('premiumThreshold')} aria-label={t('premiumThreshold')} />
          <Button onClick={() => void saveFunnel()} disabled={saving}>{saving ? t('saving') : t('saveContinue')}</Button>
        </div>
      )}

      {step === 6 && product && (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="font-medium">{t('reviewTitle')}</h2>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted-foreground">{t('internalName')}</dt><dd>{product.internal_name ?? '—'}</dd></div>
            <div><dt className="text-muted-foreground">{t('type')}</dt><dd>{optionLabel(PRODUCT_TYPES, enumId(product.type, 1), locale)}</dd></div>
            <div><dt className="text-muted-foreground">{t('basePrice')}</dt><dd>{product.base_price ?? '—'} {product.currency ?? ''}</dd></div>
            <div><dt className="text-muted-foreground">{t('salePrice')}</dt><dd>{product.sale_price ?? '—'}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void setStatus(2)} disabled={saving}>{t('publish')}</Button>
            <Button variant="outline" onClick={() => void setStatus(1)} disabled={saving}>{t('saveDraft')}</Button>
            <Button variant="outline" onClick={() => void setStatus(3)} disabled={saving}>{t('archive')}</Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={saving}>{t('delete')}</Button>
          </div>
        </div>
      )}
    </section>
  )
}
