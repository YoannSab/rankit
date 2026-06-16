import { Box, Typography } from "@mui/material"
import { alpha, useTheme } from "@mui/material/styles"
import { motion } from "framer-motion"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import { PlayerAvatar } from "./PlayerAvatar"
import type { Player } from "../types/types"

export interface AvatarRankTileProps {
  player: Player
  /** Rank number shown as a badge on the avatar */
  rank?: number
  /** Emphasize this tile (e.g. the current player) */
  highlight?: boolean
  /** Small note shown under the name (e.g. "vous") */
  caption?: string
  /** Secondary line under the name (e.g. previous rank) */
  subtitle?: string
  /** Reveal status — colors the badge and shows a check/cancel icon */
  status?: "correct" | "wrong"
  /** Not yet revealed — neutral, subtle pulse */
  pending?: boolean
  size?: number
  /** Disable click-to-view-fullscreen on the avatar (e.g. while draggable) */
  disableViewer?: boolean
}

export function AvatarRankTile({
  player,
  rank,
  highlight = false,
  caption,
  subtitle,
  status,
  pending = false,
  size = 96,
  disableViewer = false,
}: AvatarRankTileProps) {
  const theme = useTheme()

  const statusColor =
    status === "correct"
      ? theme.palette.success.main
      : status === "wrong"
        ? theme.palette.error.main
        : null

  const ringColor: "primary" | "secondary" = highlight ? "secondary" : "primary"

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0.75,
        width: "100%",
        py: 0.5,
        userSelect: "none",
      }}
    >
      <Box sx={{ position: "relative", flexShrink: 0 }}>
        <Box
          sx={{
            borderRadius: "50%",
            opacity: pending ? 0.55 : 1,
            transition: "opacity 0.4s ease",
            ...(statusColor && {
              boxShadow: `0 0 0 3px ${theme.palette.background.default}, 0 0 0 5px ${statusColor}, 0 0 22px ${alpha(statusColor, 0.4)}`,
              borderRadius: "50%",
            }),
          }}
        >
          <PlayerAvatar
            player={player}
            size={size}
            animate={false}
            ring={!statusColor}
            ringColor={ringColor}
            disableViewer={disableViewer}
          />
        </Box>

        {/* Rank badge */}
        {rank !== undefined && (
          <Box
            sx={{
              position: "absolute",
              bottom: -2,
              left: -2,
              minWidth: 30,
              height: 30,
              px: 0.5,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
              fontSize: "0.95rem",
              color: "#fff",
              background: statusColor
                ? statusColor
                : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              border: `2px solid ${theme.palette.background.paper}`,
              transition: "background 0.4s ease",
            }}
          >
            {rank}
          </Box>
        )}

        {/* Status icon */}
        {status && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            style={{
              position: "absolute",
              top: -4,
              right: -4,
              borderRadius: "50%",
              background: theme.palette.background.paper,
              display: "flex",
              lineHeight: 0,
            }}
          >
            {status === "correct" ? (
              <CheckCircleIcon sx={{ color: "success.main", fontSize: 26 }} />
            ) : (
              <CancelIcon sx={{ color: "error.main", fontSize: 26 }} />
            )}
          </motion.div>
        )}
      </Box>

      <Box sx={{ textAlign: "center", maxWidth: "100%", px: 0.5 }}>
        <Typography
          variant="body1"
          sx={{
            fontWeight: 700,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: highlight ? "secondary.main" : "text.primary",
          }}
        >
          {player.name}
        </Typography>
        {caption && (
          <Typography variant="caption" color="secondary.main" sx={{ fontWeight: 600 }}>
            {caption}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", opacity: 0.7 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  )
}
