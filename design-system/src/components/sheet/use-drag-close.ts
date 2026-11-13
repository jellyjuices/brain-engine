import { useRef, useState, type PointerEvent } from 'react'

export const useDragClose = (onClose: () => void) => {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const start = useRef({ y: 0, t: 0, height: 0 })

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || (e.target as Element).closest('button, a, input')) return
    const sheet = e.currentTarget.closest<HTMLElement>('[role="dialog"]')
    start.current = { y: e.clientY, t: e.timeStamp, height: sheet?.offsetHeight ?? 1 }
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!dragging) return
    setOffset(Math.max(0, e.clientY - start.current.y))
  }

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    if (!dragging) return
    setDragging(false)
    const speed = offset / Math.max(1, e.timeStamp - start.current.t)
    if (offset > start.current.height * 0.3 || speed > 0.6) onClose()
    else setOffset(0)
  }

  const reset = () => setOffset(0)

  return {
    offset,
    dragging,
    reset,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp },
  }
}
