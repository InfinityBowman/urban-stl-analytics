import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useDataStore } from '@/stores/data-store'

/**
 * Thin wrapper that kicks off initial data loads on mount. All state now
 * lives in zustand stores (explorer-store, data-store). Consumers read
 * directly via useExplorerStore / useDataStore selectors.
 *
 * The eager layer loads are intentional: the AI command bar needs every
 * dataset queryable even if the user hasn't enabled the corresponding layer.
 * See docs/PERFORMANCE.md finding #4 for the cost / lazy-load follow-up.
 */
export function ExplorerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const data = useDataStore.getState()
    data.loadBaseData()
    data.loadLayer('complaints')
    data.loadLayer('crime')
    data.loadLayer('transit')
    data.loadLayer('vacancy')
    data.loadLayer('foodAccess')
    data.loadLayer('arpa')
    data.loadLayer('demographics')
    data.loadLayer('housing')
  }, [])

  return <>{children}</>
}
