import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { Box } from "@mui/material"
import { motion } from "framer-motion"
import type { Player } from "../types/types"

/** Movement (px) below which a press is treated as a tap, not a drag. */
const TAP_THRESHOLD = 8

export interface ReorderAvatarGridProps {
  items: Player[]
  onReorder?: (items: Player[]) => void
  draggable?: boolean
  /** Minimum tile width in px — controls how many fit per row. */
  minTileWidth?: number
  /** Called when a tile is tapped (without dragging). */
  onTileTap?: (player: Player, index: number) => void
  renderTile: (player: Player, index: number, dragging: boolean) => ReactNode
}

/**
 * Responsive grid of avatar tiles that wraps to fit the viewport width.
 *
 * When {@link draggable} is set, tiles can be dragged freely across rows and
 * columns. The dragged tile is rendered as a pointer-anchored floating clone
 * (via a portal) so it never jumps when the underlying order changes — the
 * in-flow tile is hidden as a placeholder and the neighbours animate into
 * place. A press that does not move past {@link TAP_THRESHOLD} is treated as a
 * tap and forwarded to {@link onTileTap}.
 */
export function ReorderAvatarGrid({
  items,
  onReorder,
  draggable = false,
  minTileWidth = 104,
  onTileTap,
  renderTile,
}: ReorderAvatarGridProps) {
  const refs = useRef(new Map<string, HTMLDivElement>())
  const [dragId, setDragId] = useState<string | null>(null)
  const [pointer, setPointer] = useState({ x: 0, y: 0 })
  const grab = useRef({ dx: 0, dy: 0, w: 0, h: 0 })
  const start = useRef({ x: 0, y: 0 })
  const moved = useRef(false)
  // Fixed screen-space centers of each grid slot, captured once at drag start so
  // hit-testing is immune to the layout animation of the reflowing tiles.
  const slots = useRef<{ x: number; y: number }[]>([])
  const itemsRef = useRef(items)
  itemsRef.current = items

  useEffect(() => {
    if (!dragId) return

    const handleMove = (e: PointerEvent) => {
      setPointer({ x: e.clientX, y: e.clientY })
      if (!moved.current) {
        if (Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > TAP_THRESHOLD) {
          moved.current = true
          setPointer({ x: e.clientX, y: e.clientY })
        }
      }
      if (!onReorder || !moved.current) return

      const list = itemsRef.current
      const idx = list.findIndex((it) => it.id === dragId)
      if (idx < 0 || slots.current.length !== list.length) return

      // Find the slot whose fixed center is nearest the pointer.
      let best = idx
      let bestDist = Infinity
      for (let k = 0; k < slots.current.length; k++) {
        const s = slots.current[k]
        const d = (e.clientX - s.x) ** 2 + (e.clientY - s.y) ** 2
        if (d < bestDist) {
          bestDist = d
          best = k
        }
      }

      if (best !== idx) {
        const next = [...list]
        const [m] = next.splice(idx, 1)
        next.splice(best, 0, m)
        onReorder(next)
      }
    }

    const handleUp = () => {
      if (!moved.current && onTileTap) {
        const idx = itemsRef.current.findIndex((it) => it.id === dragId)
        if (idx >= 0) onTileTap(itemsRef.current[idx], idx)
      }
      moved.current = false
      slots.current = []
      setDragId(null)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
    window.addEventListener("pointercancel", handleUp)
    return () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
      window.removeEventListener("pointercancel", handleUp)
    }
  }, [dragId, onReorder, onTileTap])

  const startDrag = (e: React.PointerEvent, id: string) => {
    if (!draggable && !onTileTap) return
    const el = refs.current.get(id)
    if (!el) return
    const r = el.getBoundingClientRect()
    grab.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, w: r.width, h: r.height }
    start.current = { x: e.clientX, y: e.clientY }
    moved.current = false
    // Snapshot the center of every slot in the current order (stable geometry).
    slots.current = itemsRef.current.map((it) => {
      const tile = refs.current.get(it.id)
      if (!tile) return { x: 0, y: 0 }
      const tr = tile.getBoundingClientRect()
      return { x: tr.left + tr.width / 2, y: tr.top + tr.height / 2 }
    })
    setPointer({ x: e.clientX, y: e.clientY })
    setDragId(id)
  }

  const dragIndex = dragId ? items.findIndex((it) => it.id === dragId) : -1
  const dragItem = dragIndex >= 0 ? items[dragIndex] : null
  const overlayActive = Boolean(dragItem) && moved.current
  const interactive = draggable || Boolean(onTileTap)

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fill, minmax(${minTileWidth}px, 1fr))`,
          gap: 1.5,
          justifyItems: "center",
        }}
      >
        {items.map((item, index) => {
          const isDragging = dragId === item.id
          // While actively dragging, the dragged slot is an empty spacer so the
          // avatar only ever appears once (in the floating overlay).
          const showSpacer = isDragging && overlayActive
          return (
            <motion.div
              key={item.id}
              layout
              ref={(el: HTMLDivElement | null) => {
                if (el) refs.current.set(item.id, el)
                else refs.current.delete(item.id)
              }}
              onPointerDown={interactive ? (e) => startDrag(e, item.id) : undefined}
              transition={{ type: "spring", stiffness: 600, damping: 40 }}
              style={{
                position: "relative",
                width: "100%",
                display: "flex",
                justifyContent: "center",
                cursor: draggable ? "grab" : onTileTap ? "pointer" : "default",
                touchAction: interactive ? "none" : "auto",
              }}
            >
              {showSpacer ? (
                <Box sx={{ width: "100%", height: grab.current.h, opacity: 0 }} />
              ) : (
                renderTile(item, index, isDragging)
              )}
            </motion.div>
          )
        })}
      </Box>

      {overlayActive &&
        dragItem &&
        createPortal(
          <Box
            sx={{
              position: "fixed",
              left: pointer.x - grab.current.dx,
              top: pointer.y - grab.current.dy,
              width: grab.current.w,
              pointerEvents: "none",
              zIndex: 1500,
            }}
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.12 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                filter: "drop-shadow(0 14px 28px rgba(0,0,0,0.5))",
              }}
            >
              {renderTile(dragItem, dragIndex, true)}
            </motion.div>
          </Box>,
          document.body,
        )}
    </>
  )
}
