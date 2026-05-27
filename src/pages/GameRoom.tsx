import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { Box, Chip, CircularProgress, Container, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { useRankIt } from "../hooks/useRankIt"
import { WaitingPhase } from "../components/phases/WaitingPhase"
import { VotingPhase } from "../components/phases/VotingPhase"
import { JudgingPhase } from "../components/phases/JudgingPhase"
import { ResultsPhase } from "../components/phases/ResultsPhase"

export function GameRoom() {
  const { code } = useParams<{ code: string }>()
  const { game, player, isMaster, gameCode, setGameCode, restorePlayer } = useRankIt()

  // Sync gameCode from URL param
  useEffect(() => {
    if (code && code !== gameCode) {
      setGameCode(code)
    }
  }, [code, gameCode, setGameCode])

  // Try to restore player from localStorage once game is loaded
  useEffect(() => {
    restorePlayer()
  }, [restorePlayer])

  if (!game || !player || !code) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    )
  }

  const phase = game.state.phase

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
      })}
    >
      {/* Header */}
      <Box
        sx={(theme) => ({
          position: "sticky",
          top: 0,
          zIndex: 10,
          py: 1.5,
          px: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: alpha(theme.palette.background.default, 0.85),
          backdropFilter: "blur(12px)",
          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.07)}`,
        })}
      >
        <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {game.name}
          </Typography>
          <Chip label={`#${code}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          <Chip
            label={phase === "waiting" ? "Attente" : phase === "voting" ? "Vote" : phase === "judging" ? "Jugement" : "Résultats"}
            size="small"
            color={phase === "waiting" ? "warning" : phase === "results" ? "success" : "primary"}
          />
        </Stack>
        <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {game.players.length} joueur{game.players.length !== 1 ? "s" : ""}
          </Typography>
          {isMaster && (
            <Chip label="Maître" size="small" color="primary" />
          )}
        </Stack>
      </Box>

      {/* Phase content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        {phase === "waiting" && <WaitingPhase />}
        {phase === "voting" && <VotingPhase />}
        {phase === "judging" && <JudgingPhase />}
        {phase === "results" && <ResultsPhase />}
      </Container>
    </Box>
  )
}
