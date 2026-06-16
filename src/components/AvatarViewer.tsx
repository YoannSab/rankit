import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { Box, IconButton, Typography } from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import { AnimatePresence, motion } from "framer-motion"
import CloseIcon from "@mui/icons-material/Close"
import type { Player } from "../types/types"

type ViewablePlayer = Pick<Player, "name" | "avatar">

interface AvatarViewerContextValue {
  open: (player: ViewablePlayer) => void
}

const AvatarViewerContext = createContext<AvatarViewerContextValue>({ open: () => {} })

export function useAvatarViewer() {
  return useContext(AvatarViewerContext)
}

// Deterministic gradient per name (kept in sync with PlayerAvatar).
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

export function AvatarViewerProvider({ children }: { children: ReactNode }) {
  const theme = useTheme()
  const [viewing, setViewing] = useState<ViewablePlayer | null>(null)

  const open = useCallback((player: ViewablePlayer) => setViewing(player), [])
  const close = useCallback(() => setViewing(null), [])

  const [c1, c2] = viewing ? GRADIENTS[hashName(viewing.name) % GRADIENTS.length] : GRADIENTS[0]

  return (
    <AvatarViewerContext.Provider value={{ open }}>
      {children}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 24,
              padding: 24,
              background: alpha("#05070f", 0.92),
              backdropFilter: "blur(12px)",
              cursor: "zoom-out",
            }}
          >
            <IconButton
              onClick={close}
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                color: "#fff",
                background: alpha("#ffffff", 0.08),
                "&:hover": { background: alpha("#ffffff", 0.16) },
              }}
            >
              <CloseIcon />
            </IconButton>

            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{ cursor: "default", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}
            >
              <Box
                sx={{
                  width: "min(78vw, 420px)",
                  height: "min(78vw, 420px)",
                  borderRadius: 6,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: `0 24px 80px ${alpha(theme.palette.primary.main, 0.45)}`,
                  border: `2px solid ${alpha("#ffffff", 0.12)}`,
                  background: viewing.avatar
                    ? "#000"
                    : `linear-gradient(135deg, ${c1}, ${c2})`,
                }}
              >
                {viewing.avatar ? (
                  <Box
                    component="img"
                    src={viewing.avatar}
                    alt={viewing.name}
                    sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <Typography sx={{ fontSize: "min(30vw, 160px)", fontWeight: 900, color: "#fff" }}>
                    {initials(viewing.name)}
                  </Typography>
                )}
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#fff", textAlign: "center" }}>
                {viewing.name}
              </Typography>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AvatarViewerContext.Provider>
  )
}
