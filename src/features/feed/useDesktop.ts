import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 1024px)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

/** true a partir do breakpoint `lg` do Tailwind (1024px). */
export function useDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches)
}
