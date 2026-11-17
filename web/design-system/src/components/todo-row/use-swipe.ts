import { useRef, useState, type PointerEvent, type MouseEvent } from 'react'

const slop = 8

export const useSwipe = (measure: () => number, disabled?: boolean) => {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef({ x: 0, y: 0, base: 0, width: 0, active: false, moved: false })

  const open = () => setOffset(-measure())
  const close = () => setOffset(0)

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (disabled || e.button !== 0) return
    start.current = { x: e.clientX, y: e.clientY, base: offset, width: measure(), active: true, moved: false }
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const s = start.current
    if (!s.active) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.moved) {
      if (Math.abs(dx) < slop || Math.abs(dx) < Math.abs(dy)) return
      s.moved = true
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setOffset(Math.max(-s.width, Math.min(0, s.base + dx)))
  }

  const onPointerUp = () => {
    const s = start.current
    if (!s.active) return
    s.active = false
    if (!s.moved) return
    setDragging(false)
    setOffset((o) => (o < -s.width / 2 ? -s.width : 0))
  }

  const onClickCapture = (e: MouseEvent<HTMLElement>) => {
    if (start.current.moved) {
      start.current.moved = false
      e.preventDefault()
      e.stopPropagation()
    } else if (offset !== 0) {
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  }

  return {
    offset,
    dragging,
    open,
    close,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp, onClickCapture },
  }
}
