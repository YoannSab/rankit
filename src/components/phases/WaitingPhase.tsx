import { Box, Button, Chip, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { AnimatePresence, motion } from "framer-motion"
import PersonIcon from "@mui/icons-material/Person"
import GavelIcon from "@mui/icons-material/Gavel"
import PlayArrowIcon from "@mui/icons-material/PlayArrow"
import StarIcon from "@mui/icons-material/Star"
import { useRankIt } from "../../hooks/useRankIt"
import { advancePhase, updatePlayerRole } from "../../services/game.service"
import { PlayerAvatar } from "../PlayerAvatar"
import type { Player, Role } from "../../types/types"

export function WaitingPhase() {
  const { game, gameCode, player, setPlayer } = useRankIt()
  if (!game || !gameCode || !player) return null

  const isMaster = game.masterId === player.id
  const players = game.players.filter((p) => p.role === "player")
  const judges = game.players.filter((p) => p.role === "judge")

  const handleStart = () => {
    advancePhase(gameCode, "voting")
  }

  const handleChangeRole = async (role: Role) => {
    if (role === player.role) return
    await updatePlayerRole(gameCode, player.id, role)
    setPlayer({ ...player, role })
  }

  return (
    <Box>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          En attente des joueurs…
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Partagez le code{" "}
          <Box component="strong" sx={{ color: "primary.main", letterSpacing: 1 }}>
            {gameCode}
          </Box>{" "}
          avec vos amis.
        </Typography>
      </Box>

      <PeopleSection
        icon={<PersonIcon sx={{ fontSize: 18, color: "secondary.main" }} />}
        title="Joueurs"
        count={players.length}
        accent="secondary"
        people={players}
        masterId={game.masterId}
      />

      {judges.length > 0 && (
        <PeopleSection
          icon={<GavelIcon sx={{ fontSize: 18, color: "primary.main" }} />}
          title="Juges"
          count={judges.length}
          accent="primary"
          people={judges}
          masterId={game.masterId}
        />
      )}

      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Stack sx={{ alignItems: "center", gap: 1, mb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Votre rôle
          </Typography>
          <Stack direction="row" sx={{ gap: 1 }}>
            {(["player", "judge"] as const).map((r) => (
              <Button
                key={r}
                variant={player.role === r ? "contained" : "outlined"}
                onClick={() => handleChangeRole(r)}
                startIcon={r === "player" ? <PersonIcon /> : <GavelIcon />}
                sx={{ textTransform: "none", fontWeight: 600, minWidth: 120 }}
              >
                {r === "player" ? "Joueur" : "Juge"}
              </Button>
            ))}
          </Stack>
        </Stack>

        {isMaster ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            disabled={players.length < 2}
            sx={(theme) => ({
              textTransform: "none",
              fontWeight: 700,
              py: 1.6,
              px: 5,
              borderRadius: 3,
              fontSize: "1rem",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 6px 24px ${alpha(theme.palette.primary.main, 0.35)}`,
            })}
          >
            Lancer la partie
          </Button>
        ) : (
          <Typography variant="body2" color="text.disabled">
            En attente du lancement par le maître…
          </Typography>
        )}
      </Box>
    </Box>
  )
}

// ── People grid section ───────────────────────────────────────────────────────

function PeopleSection({
  icon,
  title,
  count,
  accent,
  people,
  masterId,
}: {
  icon: React.ReactNode
  title: string
  count: number
  accent: "primary" | "secondary"
  people: Player[]
  masterId: string
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "center", gap: 1, mb: 2 }}>
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
          {title} · {count}
        </Typography>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(3, 1fr)",
            sm: "repeat(4, 1fr)",
            md: "repeat(5, 1fr)",
          },
          gap: 2,
        }}
      >
        <AnimatePresence>
          {people.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.6, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 400, damping: 24, delay: i * 0.04 }}
            >
              <Stack sx={{ alignItems: "center", gap: 1, position: "relative" }}>
                <Box sx={{ position: "relative" }}>
                  <PlayerAvatar player={p} size={92} ringColor={accent} animate={false} />
                  {p.id === masterId && (
                    <Box
                      sx={(theme) => ({
                        position: "absolute",
                        top: -4,
                        right: -4,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: theme.palette.warning.main,
                        border: `2px solid ${theme.palette.background.default}`,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.warning.main, 0.5)}`,
                        zIndex: 1,
                      })}
                    >
                      <StarIcon sx={{ fontSize: 14, color: "#000" }} />
                    </Box>
                  )}
                </Box>
                <Chip
                  label={p.name}
                  size="small"
                  sx={(theme) => ({
                    maxWidth: "100%",
                    fontWeight: 600,
                    background: alpha(theme.palette.common.white, 0.05),
                    border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  })}
                />
              </Stack>
            </motion.div>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  )
}
