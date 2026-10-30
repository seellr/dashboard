'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import {
  Search,
  HelpCircle,
  MessageSquareQuote,
  Boxes,
  Tag,
  Plus,
  Trash2,
  Globe,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ProductSeoSchema,
  type ProductSeoInput,
  type ProductFaqInput,
  type ProductTestimonialInput,
  type ProductCrmTagInput,
  type ProductBundleItemInput,
  type Product,
} from '@/types/dto/product.dto'
import {
  updateProductSeo,
  createProductFaq,
  deleteProductFaq,
  createProductTestimonial,
  deleteProductTestimonial,
  addProductBundleItem,
  deleteProductBundleItem,
  addProductCrmTag,
  deleteProductCrmTag,
  setFormApiErrors,
} from '@/lib/admin/products-client'

interface StepExtrasFormProps {
  ulid: string
  product: Product | null
  onSuccess: () => void
  onBack?: () => void
}

export function StepExtrasForm({
  ulid,
  product,
  onSuccess,
  onBack,
}: StepExtrasFormProps) {
  const t = useTranslations('admin.products')
  const [activeSubTab, setActiveSubTab] = useState<'seo' | 'faqs' | 'testimonials' | 'bundle' | 'crm'>('seo')
  const [serverError, setServerError] = useState<string | null>(null)
  const [seoSavedSuccess, setSeoSavedSuccess] = useState(false)

  // Sub-resource lists
  const [faqs, setFaqs] = useState<any[]>(product?.faqs ?? [])
  const [showAddFaq, setShowAddFaq] = useState(false)
  const [newFaq, setNewFaq] = useState<ProductFaqInput>({
    sort_order: 0,
    translations: { ar: { question: '', answer: '' }, en: { question: '', answer: '' } },
  })

  const [testimonials, setTestimonials] = useState<any[]>(product?.testimonials ?? [])
  const [showAddTestimonial, setShowAddTestimonial] = useState(false)
  const [newTestimonial, setNewTestimonial] = useState<ProductTestimonialInput>({
    name: '',
    role: '',
    rating: 5,
    translations: { ar: { body: '' } },
  })

  const isBundle = product?.type?.id === 6
  const [bundleItems, setBundleItems] = useState<any[]>(product?.bundle_items ?? [])
  const [showAddBundleItem, setShowAddBundleItem] = useState(false)
  const [bundleItemUlid, setBundleItemUlid] = useState('')
  const [bundleError, setBundleError] = useState<string | null>(null)

  const [crmTags, setCrmTags] = useState<any[]>(product?.crm_tags ?? [])
  const [showAddCrmTag, setShowAddCrmTag] = useState(false)
  const [newCrmTag, setNewCrmTag] = useState<ProductCrmTagInput>({ tag: '', action: 'add_on_purchase' })

  // SEO Form
  const seoData = product?.seo_meta as Record<string, any> | undefined
  const defaultSeoValues: ProductSeoInput = {
    og_image_url: seoData?.og_image_url ?? '',
    canonical_url: seoData?.canonical_url ?? '',
    schema_type: seoData?.schema_type ?? 'Product',
    translations: {
      ar: {
        meta_title: seoData?.translations?.ar?.meta_title ?? '',
        meta_description: seoData?.translations?.ar?.meta_description ?? '',
      },
      en: {
        meta_title: seoData?.translations?.en?.meta_title ?? '',
        meta_description: seoData?.translations?.en?.meta_description ?? '',
      },
    },
  }

  const {
    register: registerSeo,
    handleSubmit: handleSubmitSeo,
    setError: setSeoError,
    formState: { errors: seoErrors, isSubmitting: isSeoSubmitting },
  } = useForm<ProductSeoInput>({
    resolver: zodResolver(ProductSeoSchema),
    defaultValues: defaultSeoValues,
  })

  const onSaveSeo = async (data: ProductSeoInput) => {
    setServerError(null)
    setSeoSavedSuccess(false)
    const res = await updateProductSeo(ulid, data)
    if (res.ok) {
      setSeoSavedSuccess(true)
      setTimeout(() => setSeoSavedSuccess(false), 2000)
    } else {
      if (res.status === 422 && res.errors) {
        setFormApiErrors(res.errors, setSeoError)
      }
      setServerError(res.message || 'Failed to save SEO metadata')
    }
  }

  const handleCreateFaq = async () => {
    if (!newFaq.translations.ar.question || !newFaq.translations.ar.answer) return
    const res = await createProductFaq(ulid, newFaq)
    if (res.ok) {
      setFaqs((prev) => [...prev, { ...newFaq, id: Date.now() }])
      setNewFaq({
        sort_order: 0,
        translations: { ar: { question: '', answer: '' }, en: { question: '', answer: '' } },
      })
      setShowAddFaq(false)
    }
  }

  const handleDeleteFaq = async (id: string | number) => {
    const res = await deleteProductFaq(ulid, id)
    if (res.ok) setFaqs((prev) => prev.filter((f) => f.id !== id))
  }

  const handleCreateTestimonial = async () => {
    if (!newTestimonial.name || !newTestimonial.translations.ar.body) return
    const res = await createProductTestimonial(ulid, newTestimonial)
    if (res.ok) {
      setTestimonials((prev) => [...prev, { ...newTestimonial, id: Date.now() }])
      setNewTestimonial({ name: '', role: '', rating: 5, translations: { ar: { body: '' } } })
      setShowAddTestimonial(false)
    }
  }

  const handleDeleteTestimonial = async (id: string | number) => {
    const res = await deleteProductTestimonial(ulid, id)
    if (res.ok) setTestimonials((prev) => prev.filter((t) => t.id !== id))
  }

  const handleAddBundleItem = async () => {
    setBundleError(null)
    if (!bundleItemUlid.trim()) return

    if (bundleItemUlid.trim() === ulid) {
      setBundleError(t('validation.selfBundleNotAllowed'))
      return
    }

    const res = await addProductBundleItem(ulid, { item_ulid: bundleItemUlid.trim() })
    if (res.ok) {
      setBundleItems((prev) => [...prev, { item_ulid: bundleItemUlid.trim() }])
      setBundleItemUlid('')
      setShowAddBundleItem(false)
    } else {
      setBundleError(res.message || 'Failed to add bundle item')
    }
  }

  const handleDeleteBundleItem = async (itemUlid: string) => {
    const res = await deleteProductBundleItem(ulid, itemUlid)
    if (res.ok) setBundleItems((prev) => prev.filter((i) => i.item_ulid !== itemUlid))
  }

  const handleAddCrmTag = async () => {
    if (!newCrmTag.tag.trim()) return
    const res = await addProductCrmTag(ulid, newCrmTag)
    if (res.ok) {
      setCrmTags((prev) => [...prev, { ...newCrmTag, id: Date.now() }])
      setNewCrmTag({ tag: '', action: 'add_on_purchase' })
      setShowAddCrmTag(false)
    }
  }

  const handleDeleteCrmTag = async (id: string | number) => {
    const res = await deleteProductCrmTag(ulid, id)
    if (res.ok) setCrmTags((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">
      {serverError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <Tabs
        value={activeSubTab}
        onValueChange={(val) => setActiveSubTab(val as any)}
        className="flex flex-col gap-4"
      >
        <TabsList className="w-fit flex-wrap">
          <TabsTrigger value="seo" className="gap-2 text-xs">
            <Search className="size-3.5" />
            SEO & Social
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-2 text-xs">
            <HelpCircle className="size-3.5" />
            FAQs ({faqs.length})
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-2 text-xs">
            <MessageSquareQuote className="size-3.5" />
            Testimonials ({testimonials.length})
          </TabsTrigger>
          {isBundle && (
            <TabsTrigger value="bundle" className="gap-2 text-xs">
              <Boxes className="size-3.5" />
              Bundle Items ({bundleItems.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="crm" className="gap-2 text-xs">
            <Tag className="size-3.5" />
            CRM Tags ({crmTags.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Sub-tab 1: SEO & Metadata ─────────────────────────────────────── */}
        <TabsContent value="seo" className="mt-0">
          <form onSubmit={handleSubmitSeo(onSaveSeo)} className="flex flex-col gap-4 p-5 rounded-xl border bg-card">
            {seoSavedSuccess && (
              <div className="flex items-center gap-2 p-2.5 text-xs rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                <span>SEO configuration saved!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Meta Title (AR)</Label>
                <Input
                  dir="rtl"
                  {...registerSeo('translations.ar.meta_title')}
                  placeholder="عنوان الصفحة لمحركات البحث بالعربية"
                  maxLength={160}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Meta Title (EN)</Label>
                <Input
                  {...registerSeo('translations.en.meta_title')}
                  placeholder="Page title in English for Google search"
                  maxLength={160}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Meta Description (AR)</Label>
                <Textarea
                  dir="rtl"
                  rows={2}
                  {...registerSeo('translations.ar.meta_description')}
                  placeholder="وصف مختصر يظهر في نتائج البحث (حد أقصى 320 حرف)"
                  maxLength={320}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Meta Description (EN)</Label>
                <Textarea
                  rows={2}
                  {...registerSeo('translations.en.meta_description')}
                  placeholder="Meta description snippet in English (max 320 chars)"
                  maxLength={320}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">OG Social Image URL</Label>
                <Input
                  {...registerSeo('og_image_url')}
                  placeholder="https://..."
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Canonical URL</Label>
                <Input
                  {...registerSeo('canonical_url')}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" disabled={isSeoSubmitting}>
                Save SEO Settings
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Sub-tab 2: FAQs ──────────────────────────────────────────────── */}
        <TabsContent value="faqs" className="mt-0">
          <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Frequently Asked Questions</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Answer common buyer questions</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddFaq((prev) => !prev)}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                Add FAQ
              </Button>
            </div>

            {showAddFaq && (
              <div className="p-4 rounded-xl border bg-muted/30 flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Question (Arabic) *</Label>
                  <Input
                    dir="rtl"
                    value={newFaq.translations.ar.question}
                    onChange={(e) =>
                      setNewFaq({
                        ...newFaq,
                        translations: {
                          ...newFaq.translations,
                          ar: { ...newFaq.translations.ar, question: e.target.value },
                        },
                      })
                    }
                    placeholder="السؤال بالعربية..."
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Answer (Arabic) *</Label>
                  <Textarea
                    dir="rtl"
                    rows={2}
                    value={newFaq.translations.ar.answer}
                    onChange={(e) =>
                      setNewFaq({
                        ...newFaq,
                        translations: {
                          ...newFaq.translations,
                          ar: { ...newFaq.translations.ar, answer: e.target.value },
                        },
                      })
                    }
                    placeholder="الإجابة التفصيلية بالعربية..."
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddFaq(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleCreateFaq}>
                    Save FAQ
                  </Button>
                </div>
              </div>
            )}

            {faqs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No FAQs added yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {faqs.map((f, i) => (
                  <div key={f.id || i} className="p-3 rounded-lg border bg-background flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold">{f.translations?.ar?.question || f.question}</p>
                      <p className="text-xs text-muted-foreground mt-1">{f.translations?.ar?.answer || f.answer}</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleDeleteFaq(f.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Sub-tab 3: Testimonials ──────────────────────────────────────── */}
        <TabsContent value="testimonials" className="mt-0">
          <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">Customer Testimonials</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Social proof and reviews</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddTestimonial((prev) => !prev)}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                Add Testimonial
              </Button>
            </div>

            {showAddTestimonial && (
              <div className="p-4 rounded-xl border bg-muted/30 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Customer Name *</Label>
                    <Input
                      value={newTestimonial.name}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                      placeholder="e.g. Ahmed Salem"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Role / Title</Label>
                    <Input
                      value={newTestimonial.role ?? ''}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                      placeholder="e.g. Founder at TechCo"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Rating (1-5)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="5"
                      value={newTestimonial.rating ?? 5}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium">Testimonial Body (Arabic) *</Label>
                  <Textarea
                    dir="rtl"
                    rows={2}
                    value={newTestimonial.translations.ar.body}
                    onChange={(e) =>
                      setNewTestimonial({
                        ...newTestimonial,
                        translations: { ar: { body: e.target.value } },
                      })
                    }
                    placeholder="نص التقييم والتجربة..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTestimonial(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleCreateTestimonial}>
                    Save Testimonial
                  </Button>
                </div>
              </div>
            )}

            {testimonials.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No testimonials added yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {testimonials.map((tItem, i) => (
                  <div key={tItem.id || i} className="p-3 rounded-lg border bg-background flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold">{tItem.name} {tItem.role ? `• ${tItem.role}` : ''}</p>
                      <p className="text-xs text-muted-foreground mt-1">"{tItem.translations?.ar?.body || tItem.body}"</p>
                    </div>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleDeleteTestimonial(tItem.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Sub-tab 4: Bundle Items ──────────────────────────────────────── */}
        {isBundle && (
          <TabsContent value="bundle" className="mt-0">
            <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Bundled Products</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Include other standalone products in this bundle.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddBundleItem((prev) => !prev)}
                  className="gap-1.5 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add Bundled Item
                </Button>
              </div>

              {bundleError && (
                <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{bundleError}</span>
                </div>
              )}

              {showAddBundleItem && (
                <div className="p-4 rounded-xl border bg-muted/30 flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Item Product ULID *</Label>
                    <Input
                      value={bundleItemUlid}
                      onChange={(e) => setBundleItemUlid(e.target.value)}
                      placeholder="e.g. 01KVJE5WWN4GCNMSBWGZETYRPJ"
                      maxLength={26}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Must be 26 characters. A product cannot be added to its own bundle.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddBundleItem(false)}>
                      Cancel
                    </Button>
                    <Button type="button" size="sm" onClick={handleAddBundleItem}>
                      Add to Bundle
                    </Button>
                  </div>
                </div>
              )}

              {bundleItems.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">No bundled products yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {bundleItems.map((item, i) => (
                    <div key={item.item_ulid || i} className="p-3 rounded-lg border bg-background flex items-center justify-between">
                      <span className="font-mono text-xs">{item.item_ulid || item.ulid}</span>
                      <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleDeleteBundleItem(item.item_ulid)}>
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* ── Sub-tab 5: CRM Tags ─────────────────────────────────────────── */}
        <TabsContent value="crm" className="mt-0">
          <div className="flex flex-col gap-4 p-5 rounded-xl border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold">CRM Automation Tags</h4>
                <p className="text-xs text-muted-foreground mt-0.5">Automate tagging upon purchase or lifecycle events</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCrmTag((prev) => !prev)}
                className="gap-1.5 text-xs"
              >
                <Plus className="size-3.5" />
                Add Tag
              </Button>
            </div>

            {showAddCrmTag && (
              <div className="p-4 rounded-xl border bg-muted/30 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Tag Name *</Label>
                    <Input
                      value={newCrmTag.tag}
                      onChange={(e) => setNewCrmTag({ ...newCrmTag, tag: e.target.value })}
                      placeholder="e.g. buyer_ebook_mastery"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Trigger Action *</Label>
                    <Input
                      value={newCrmTag.action}
                      onChange={(e) => setNewCrmTag({ ...newCrmTag, action: e.target.value })}
                      placeholder="add_on_purchase"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddCrmTag(false)}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" onClick={handleAddCrmTag}>
                    Save Tag
                  </Button>
                </div>
              </div>
            )}

            {crmTags.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">No CRM tags configured.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {crmTags.map((tItem, i) => (
                  <div key={tItem.id || i} className="p-3 rounded-lg border bg-background flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="size-3.5 text-primary" />
                      <span className="text-xs font-medium">{tItem.tag}</span>
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {tItem.action}
                      </span>
                    </div>
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => handleDeleteCrmTag(tItem.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onBack ? (
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            {t('wizard.back')}
          </Button>
        ) : <div />}

        <Button type="button" size="sm" onClick={onSuccess}>
          {t('wizard.saveAndContinue')}
        </Button>
      </div>
    </div>
  )
}
