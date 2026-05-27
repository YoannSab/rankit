import { Box, Button, Chip, List, ListItem, ListItemText, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import PersonIcon from "@mui/icons-material/Person"
import GavelIcon from "@mui/icons-material/Gavel"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import { useRankIt } from "../../hooks/useRankIt"
import { advancePhase } from "../../services/game.service"

export function WaitingPhase() {
  const { game, gameCode, isMaster } = useRankIt()
  if (!game || !gameCode) return null

  const players = game.players.filter((p) => p.role === "player")
  const judges = game.players.filter((p) => p.role === "judge")

  const handleStart = () => {
    advancePhase(gameCode, "voting")
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        En attente des joueurs…
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Partagez le code <strong>{gameCode}</strong> avec vos amis. Le maître lance la partie quand tout le monde est prêt.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 3, mb: 4 }}>
        {/* Players list */}
        <Box
          sx={(theme) => ({
            flex: 1,
            p: 2,
            borderRadius: 2,
            background: alpha(theme.palette.secondary.main, 0.06),
            border: `1px solid ${alpha(theme.palette.secondary.main, 0.18)}`,
          })}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 1 }}>
            <PersonIcon sx={{ fontSize: 18, color: "secondary.main" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Joueurs ({players.length})
            </Typography>
          </Stack>
          <List dense disablePadding>
            {players.map((p) => (
              <ListItem key={p.id} disablePadding>
                <ListItemText primary={p.name} />
                {p.id === game.masterId && <Chip label="Maître" size="small" color="primary" />}
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Judges list */}
        <Box
          sx={(theme) => ({
            flex: 1,
            p: 2,
            borderRadius: 2,
            background: alpha(theme.palette.primary.main, 0.06),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
          })}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 1 }}>
            <GavelIcon sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Juges ({judges.length})
            </Typography>
          </Stack>
          <List dense disablePadding>
            {judges.map((p) => (
              <ListItem key={p.id} disablePadding>
                <ListItemText primary={p.name} />
                {p.id === game.masterId && <Chip label="Maître" size="small" color="primary" />}
              </ListItem>
            ))}
          </List>
        </Box>
      </Stack>

      {/* Questions preview
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
        Questions ({game.questions.length})
      </Typography>
      <List dense disablePadding sx={{ mb: 4 }}>
        {game.questions.map((q, i) => (
          <ListItem key={q.id} disablePadding sx={{ py: 0.3 }}>
            <ListItemText primary={`${i + 1}. ${q.text}`} />
          </ListItem>
        ))}
      </List> */}

      {isMaster && (
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={handleStart}
          disabled={players.length < 2}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Lancer la partie
        </Button>
      )}
      {!isMaster && (
        <Typography variant="body2" color="text.disabled">
          En attente du lancement par le maître…
        </Typography>
      )}
    </Box>
  )
}
