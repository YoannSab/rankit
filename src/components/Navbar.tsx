import { AppBar, Box, Button, Chip, Stack, Toolbar, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import WifiOffIcon from "@mui/icons-material/WifiOff"
import { useRankIt } from "../hooks/useRankIt"

export function Navbar() {
  const { isOnline } = useRankIt()

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
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <EmojiEventsIcon sx={{ color: "primary.main", fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            Rank It Conv&apos;
          </Typography>
          {!isOnline && (
            <Chip
              icon={<WifiOffIcon />}
              label="Offline"
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
        </Stack>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover": { background: (theme: import("@mui/material").Theme) => alpha(theme.palette.primary.main, 0.12) },
            }}
          >
            Sign In
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
