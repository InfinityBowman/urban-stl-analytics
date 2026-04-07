import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useDataStore } from '@/stores/data-store'

/**
 * Thin wrapper that kicks off the always-needed base data on mount
 * (neighborhoods, routes, grocery stores). Layer datasets are loaded
 * lazily by their respective layer components on mount, by detail panels
 * on selection, and by the AI executors when a tool needs them.
 *
 * All state lives in zustand stores (explorer-store, data-store);
 * consumers read directly via useExplorerStore / useDataStore selectors.
 */
export function ExplorerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    useDataStore.getState().loadBaseData()
  }, [])

  return <>{children}</>
}
