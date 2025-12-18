import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Use matchMedia.matches for initial value to avoid flicker
    setIsMobile(mql.matches)
    
    // Use matchMedia listener for better performance
    mql.addEventListener("change", onChange)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Hook to detect touch device
export function useIsTouchDevice() {
  const [isTouch, setIsTouch] = React.useState<boolean>(false)

  React.useEffect(() => {
    setIsTouch(
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0
    )
  }, [])

  return isTouch
}

// Hook for device pixel ratio (for optimizing images)
export function useDevicePixelRatio() {
  const [dpr, setDpr] = React.useState<number>(1)

  React.useEffect(() => {
    setDpr(window.devicePixelRatio || 1)
  }, [])

  return dpr
}
