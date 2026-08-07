'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export interface Brand {
  id: number
  ulid: string
  name: string
  slug: string
}

export const BRANDS: Brand[] = [
  { id: 1, ulid: '01KVJE5WWN4GCNMSBWGZETYRPJ', name: 'ME.INC', slug: 'meinc' },
  { id: 2, ulid: '01KVJE5WX21HP4HE9YS52MVFFE', name: 'Ramy Mortada', slug: 'ramymortada' },
  { id: 3, ulid: '01KVJE5WX610PDVHPS6ZWB9MJC', name: 'Solo Founder', slug: 'solofounder' },
]

const STORAGE_KEY = 'admin_active_brand_id'

type BrandContextValue = {
  activeBrand: Brand
  setActiveBrand: (brand: Brand) => void
}

const BrandContext = createContext<BrandContextValue>({
  activeBrand: BRANDS[0],
  setActiveBrand: () => { },
})

export function AdminBrandProvider({ children }: { children: React.ReactNode }) {
  const [activeBrand, setActiveBrandState] = useState<Brand>(BRANDS[0])

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '1', 10)
    const found = BRANDS.find((b) => b.id === stored)
    if (found) setActiveBrandState(found)
  }, [])

  const setActiveBrand = useCallback((brand: Brand) => {
    localStorage.setItem(STORAGE_KEY, String(brand.id))
    setActiveBrandState(brand)
  }, [])

  const value = useMemo(() => ({ activeBrand, setActiveBrand }), [activeBrand, setActiveBrand])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

export function useActiveBrand() {
  return useContext(BrandContext)
}

export function getActiveBrandId(): number {
  if (typeof window === 'undefined') return 1
  return parseInt(localStorage.getItem(STORAGE_KEY) ?? '1', 10)
}
