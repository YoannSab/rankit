import { Avatar } from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import { motion } from "framer-motion"
import { useAvatarViewer } from "./AvatarViewer"
import type { Player } from "../types/types"

const MotionAvatar = motion.create(Avatar)

// Deterministic gradient per name so initials-only avatars stay consistent.
const GRADIENTS = [
  ["#7c3aed", "#06b6d4"],
  ["#06b6d4", "#10b981"],
  ["#f59e0b", "#ef4444"],
  ["#ec4899", "#8b5cf6"],
  ["#3b82f6", "#06b6d4"],
  ["#10b981", "#84cc16"],
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export interface PlayerAvatarProps {
  player: Pick<Player, "name" | "avatar">
  size?: number
  /** Draw a subtle gradient ring around the avatar */
  ring?: boolean
  /** Highlight color for the ring (e.g. "primary" | "secondary") */
  ringColor?: "primary" | "secondary"
  /** Animate on mount */
  animate?: boolean
  /** Disable click-to-view-fullscreen (e.g. inside draggable tiles) */
  disableViewer?: boolean
}

export function PlayerAvatar({
  player,
  size = 44,
  ring = true,
  ringColor = "primary",
  animate = true,
  disableViewer = false,
}: PlayerAvatarProps) {
  const theme = useTheme()
  const viewer = useAvatarViewer()
  const [c1, c2] = GRADIENTS[hashName(player.name) % GRADIENTS.length]
  const ringMain =
    ringColor === "secondary" ? theme.palette.secondary.main : theme.palette.primary.main

  const handleClick = disableViewer
    ? undefined
    : (e: React.MouseEvent) => {
        e.stopPropagation()
        viewer.open(player)
      }

  const ringSx = ring
    ? {
        padding: "2px",
        background: `linear-gradient(135deg, ${ringMain}, ${theme.palette.secondary.main})`,
        boxShadow: `0 0 12px ${alpha(ringMain, 0.35)}`,
      }
    : {}

  const inner = (
    <MotionAvatar
      src={player.avatar || undefined}
      alt={player.name}
      onClick={handleClick}
      initial={animate ? { scale: 0, rotate: -25, opacity: 0 } : false}
      animate={animate ? { scale: 1, rotate: 0, opacity: 1 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        fontWeight: 800,
        color: "#fff",
        cursor: handleClick ? "zoom-in" : undefined,
        background: player.avatar
          ? undefined
          : `linear-gradient(135deg, ${c1}, ${c2})`,
        border: ring ? `2px solid ${theme.palette.background.paper}` : "none",
      }}
    >
      {!player.avatar && initials(player.name)}
    </MotionAvatar>
  )

  if (!ring) return inner

  return (
    <motion.div
      initial={animate ? { scale: 0.6, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      style={{
        display: "inline-flex",
        borderRadius: "50%",
        cursor: handleClick ? "zoom-in" : undefined,
        ...ringSx,
      }}
    >
      {inner}
    </motion.div>
  )
}
