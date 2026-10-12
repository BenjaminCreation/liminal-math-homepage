'use client'
import { useSyncExternalStore } from 'react'

const noop = () => () => {}

/** Skips server rendering for pages whose markup depends on the current time. */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false)
  return mounted ? <>{children}</> : null
}
