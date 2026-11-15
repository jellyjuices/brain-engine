import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react'

const HOLD_MS = 500
const SLOP = 8

export const useLongPress = (onLongPress?: () => void) => {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const origin = useRef({ x: 0, y: 0, fired: false })

  const cancel = () => {
    window.clearTimeout(timer.current)
    timer.current = undefined
    setHolding(false)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (!onLongPress || e.button !== 0 || (e.target as Element).closest('[role="checkbox"]')) return
    origin.current = { x: e.clientX, y: e.clientY, fired: false }
    setHolding(true)
    timer.current = window.setTimeout(() => {
      origin.current.fired = true
      setHolding(false)
      onLongPress()
    }, HOLD_MS)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (timer.current === undefined) return
    if (Math.hypot(e.clientX - origin.current.x, e.clientY - origin.current.y) > SLOP) cancel()
  }

  const onClickCapture = (e: MouseEvent<HTMLElement>) => {
    if (!origin.current.fired) return
    origin.current.fired = false
    e.preventDefault()
    e.stopPropagation()
  }

  return {
    holding,
    handlers: { onPointerDown, onPointerMove, onPointerUp: cancel, onPointerCancel: cancel, onClickCapture },
  }
}
