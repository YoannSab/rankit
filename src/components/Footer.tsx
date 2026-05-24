import { Box, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"

const LINKS = ["Privacy", "Terms", "Contact"]

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
        © {new Date().getFullYear()} Rank It Conv&apos; — All rights reserved.
      </Typography>
      <Stack direction="row" sx={{ gap: 3, justifyContent: "center" }}>
        {LINKS.map((link) => (
          <Typography
            key={link}
            variant="body2"
            sx={{
              color: "text.disabled",
              cursor: "pointer",
              transition: "color 0.2s",
              "&:hover": { color: "primary.light" },
            }}
          >
            {link}
          </Typography>
        ))}
      </Stack>
    </Box>
  )
}
