'use client'
import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 760px)'
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

/** Renders the mobile variant at <=760px, otherwise the desktop one. Client-only: the choice needs the viewport. */
export function Responsive({ desktop, mobile }: { desktop: React.ReactNode; mobile: React.ReactNode }) {
  const isMobile = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => null,
  )
  if (isMobile === null) return null
  return <>{isMobile ? mobile : desktop}</>
}
