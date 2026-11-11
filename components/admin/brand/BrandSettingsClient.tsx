'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActiveBrand } from '@/lib/admin/brand-context'
import {
  adminOperationsApi,
  type BrandConfigData,
  type BrandRecord,
} from '@/lib/admin/operations-client'
import { BrandCoreForm } from './BrandCoreForm'
import { BrandConfigClient } from './BrandConfigClient'

export function BrandSettingsClient() {
  const { activeBrand } = useActiveBrand()
  const [brand, setBrand] = useState<BrandRecord | null>(null)
  const [config, setConfig] = useState<BrandConfigData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const [brandResult, configResult] = await Promise.all([
      adminOperationsApi.getBrand(activeBrand.ulid),
      adminOperationsApi.getBrandConfig(activeBrand.ulid),
    ])

    if (brandResult.ok) setBrand(brandResult.data)
    if (configResult.ok) setConfig(configResult.data ?? {})

    const failure = !brandResult.ok ? brandResult : !configResult.ok ? configResult : null
    if (failure) setError(failure.message)
    setLoading(false)
  }, [activeBrand.ulid])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [load])

  if (loading && !brand) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full max-w-2xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {error && (
        <div className="flex max-w-2xl items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="me-2 size-4" />
            Retry
          </Button>
        </div>
      )}

      {brand && (
        <Tabs defaultValue="brand">
          <TabsList>
            <TabsTrigger value="brand">Brand</TabsTrigger>
            <TabsTrigger value="appearance">Config</TabsTrigger>
          </TabsList>

          <TabsContent value="brand" className="pt-4">
            <BrandCoreForm key={brand.ulid} brand={brand} onSaved={() => void load()} />
          </TabsContent>

          <TabsContent value="appearance" className="pt-4">
            <BrandConfigClient key={brand.ulid} config={config} brandUlid={brand.ulid} onSaved={() => void load()} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
