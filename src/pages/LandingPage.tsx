import { useNavigate } from "react-router-dom"
import { Box, Button, Container, Stack } from "@mui/material"
import { alpha } from "@mui/material/styles"
import AddIcon from "@mui/icons-material/Add"
import LoginIcon from "@mui/icons-material/Login"
import { Footer } from "../components/Footer"
import { Hero } from "../components/Hero"
import { Navbar } from "../components/Navbar"

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: [
          `radial-gradient(ellipse at 20% 0%, ${alpha(theme.palette.primary.main, 0.12)} 0%, transparent 60%)`,
          `radial-gradient(ellipse at 80% 10%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 55%)`,
          `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
        ].join(", "),
      })}
    >
      <Navbar />

      <Container
        maxWidth="sm"
        sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        <Hero />

        <Stack sx={{ gap: 2, pb: { xs: 6, md: 10 } }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => navigate("/create")}
            sx={(theme) => ({
              py: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1.1rem",
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.73)} 100%)`,
            })}
          >
            Create a Game
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<LoginIcon />}
            onClick={() => navigate("/join")}
            sx={(theme) => ({
              py: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: "1.1rem",
              borderRadius: 2,
              borderColor: theme.palette.secondary.main,
              color: theme.palette.secondary.main,
              "&:hover": {
                background: alpha(theme.palette.secondary.main, 0.08),
                borderColor: theme.palette.secondary.main,
              },
            })}
          >
            Join a Game
          </Button>
        </Stack>
      </Container>

      <Footer />
    </Box>
  )
}
