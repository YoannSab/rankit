import { Box, Typography } from "@mui/material"

export function Hero() {
  return (
    <Box
      sx={{
        textAlign: "center",
        pt: { xs: 8, md: 12 },
        pb: { xs: 6, md: 8 },
        px: 2,
      }}
    >
      <Typography
        variant="h2"
        sx={(theme) => ({
          fontWeight: 800,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          fontSize: { xs: "2.4rem", sm: "3rem", md: "4rem" },
          letterSpacing: -1.5,
          mb: 2,
        })}
      >
        Rank It Conv&apos;
      </Typography>

      <Typography
        variant="h6"
        color="text.secondary"
        sx={{ maxWidth: 540, mx: "auto", lineHeight: 1.75, fontWeight: 400 }}
      >
        Rank your friends, guess each other&apos;s choices. Who really knows the group?
      </Typography>
    </Box>
  )
}
