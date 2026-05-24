import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useRankIt } from "../hooks/useRankIt"
import { joinGame } from "../services/game.service"
import type { Player, Role } from "../types/types"

export function JoinGame() {
  const navigate = useNavigate()
  const { setPlayer, setGameCode } = useRankIt()

  const [code, setCode] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [role, setRole] = useState<Role>("player")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    code.trim().length === 5 && playerName.trim().length > 0 && !loading

  const handleJoin = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const playerId = crypto.randomUUID()
      const player: Player = { id: playerId, name: playerName.trim(), role }
      await joinGame(code.toUpperCase(), player)
      setPlayer(player)
      setGameCode(code.toUpperCase())
      navigate(`/game/${code.toUpperCase()}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game.")
      setLoading(false)
    }
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
      })}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{ mb: 3, color: "text.secondary", textTransform: "none" }}
        >
          Back
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Join a Game
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Enter the 5-character code shared by the game host.
        </Typography>

        <TextField
          fullWidth
          label="Game Code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
          inputProps={{ maxLength: 5, style: { letterSpacing: 4, fontWeight: 700 } }}
          placeholder="ABC12"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          inputProps={{ maxLength: 30 }}
          sx={{ mb: 2 }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Your role
        </Typography>
        <Stack direction="row" sx={{ gap: 1, mb: 3 }}>
          {(["player", "judge"] as const).map((r) => (
            <Button
              key={r}
              variant={role === r ? "contained" : "outlined"}
              onClick={() => setRole(r)}
              sx={{ textTransform: "capitalize", flex: 1 }}
            >
              {r}
            </Button>
          ))}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={!canSubmit}
          onClick={handleJoin}
          sx={(theme) => ({
            py: 1.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1rem",
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${alpha(theme.palette.secondary.main, 0.73)} 100%)`,
          })}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : `Join as ${role}`}
        </Button>
      </Container>
    </Box>
  )
}
