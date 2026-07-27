import * as React from "react"

const MOBILE_BREAKPOINT = 768

const subscribeToViewportChange = (breakpoint: number, onChange: () => void) => {
  const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  return React.useSyncExternalStore(
    (onChange) => subscribeToViewportChange(breakpoint, onChange),
    () => window.innerWidth < breakpoint,
    () => false
  )
}
