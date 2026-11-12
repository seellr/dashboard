'use client'

import { useState } from 'react'
import { SellerThemeClient } from './SellerThemeClient'
import { SellerThemeSettingsClient } from './SellerThemeSettingsClient'

/**
 * Activation and settings both read `/subscriber/theme`. Keeping them as
 * siblings with independent state left the settings panel showing the previous
 * theme after an activation, so the activation bumps a revision and the
 * settings panel reloads.
 */
export function SellerThemeWorkspace() {
  const [revision, setRevision] = useState(0)

  return (
    <>
      <SellerThemeSettingsClient revision={revision} />
      <SellerThemeClient onThemeActivated={() => setRevision((value) => value + 1)} />
    </>
  )
}
