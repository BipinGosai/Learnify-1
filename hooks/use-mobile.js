import * as React from "react"

// Shared breakpoint for mobile layouts.
const MOBILE_BREAKPOINT = 768

// Hook that returns true when the viewport is below the mobile breakpoint.
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(undefined)

  React.useEffect(() => {
    // Use matchMedia to respond to viewport changes.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // Initialize on mount so first render can adapt quickly.
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange);
  }, [])

  // Coerce undefined to false for a stable boolean return value.
  return !!isMobile
}
