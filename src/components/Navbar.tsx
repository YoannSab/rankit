import { AppBar, Box, Chip, Stack, Toolbar, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import WifiOffIcon from "@mui/icons-material/WifiOff"
import { useNavigate } from "react-router-dom"
import { useRankIt } from "../hooks/useRankIt"

export function Navbar() {
  const { isOnline } = useRankIt()
  const navigate = useNavigate()

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={(theme) => ({
        background: alpha(theme.palette.background.default, 0.75),
        backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
      })}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        <Stack
          direction="row"
          sx={{ alignItems: "center", gap: 1, cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <EmojiEventsIcon sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            Rank It Conv&apos;
          </Typography>
        </Stack>

        {!isOnline && (
          <Chip
            icon={<WifiOffIcon />}
            label="Hors ligne"
            size="small"
            sx={(theme) => ({
              fontSize: "0.65rem",
              height: 20,
              bgcolor: alpha(theme.palette.common.white, 0.06),
              color: "text.disabled",
              "& .MuiChip-icon": { fontSize: 12 },
            })}
          />
        )}
      </Toolbar>
    </AppBar>
  )
}
