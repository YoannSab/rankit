import { Box, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"

export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        textAlign: "center",
        borderTop: (theme: import("@mui/material").Theme) => `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
        mt: "auto",
      }}
    >
      <Typography variant="body2" color="text.disabled" sx={{ mb: 1 }}>
        © {new Date().getFullYear()} Rank It Conv&apos; — Tous droits réservés.
      </Typography>
    </Box>
  )
}
