import { Box, LinearProgress, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { motion } from "framer-motion"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import { useRankIt } from "../../hooks/useRankIt"
import { QuestionComparison } from "../QuestionComparison"

export function ResultsPhase() {
  const { game } = useRankIt()
  if (!game) return null

  const players = game.players.filter((p) => p.role === "player")

  // ── Compute global score ────────────────────────────────────────────────────

  let totalPlacements = 0
  let correctPlacements = 0

  game.questions.forEach((question) => {
    const truth = game.groundTruth?.[question.id]
    const judgeRank = game.judgeRankings?.[question.id]
    if (!truth || !judgeRank) return
    players.forEach((p) => {
      if (truth[p.id] === judgeRank[p.id]) correctPlacements++
      totalPlacements++
    })
  })

  const accuracy = totalPlacements > 0 ? Math.round((correctPlacements / totalPlacements) * 100) : 0

  // Score tier
  const getTier = (pct: number) => {
    if (pct >= 90) return { label: "Légende", color: "warning" as const, emoji: "👑" }
    if (pct >= 70) return { label: "Excellent", color: "success" as const, emoji: "🌟" }
    if (pct >= 50) return { label: "Pas mal", color: "primary" as const, emoji: "👍" }
    if (pct >= 30) return { label: "Peut mieux faire", color: "secondary" as const, emoji: "🤔" }
    return { label: "Catastrophe", color: "error" as const, emoji: "💀" }
  }
  const tier = getTier(accuracy)

  return (
    <Box>
      {/* ── Hero Score ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <Box
          sx={(theme) => ({
            textAlign: "center",
            py: 2.5,
            px: 2.5,
            mb: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          })}
        >
          <EmojiEventsIcon sx={{ fontSize: 36, color: "warning.main", mb: 0.5 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.25 }}>
            {tier.emoji} {tier.label}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, color: "primary.main", mb: 0.5 }}>
            {accuracy}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {correctPlacements} placement{correctPlacements !== 1 ? "s" : ""} correct{correctPlacements !== 1 ? "s" : ""} sur {totalPlacements}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={accuracy}
            sx={(theme) => ({
              mt: 1.5,
              mx: "auto",
              maxWidth: 260,
              height: 8,
              borderRadius: 5,
              backgroundColor: alpha(theme.palette.common.white, 0.08),
              "& .MuiLinearProgress-bar": {
                borderRadius: 5,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            })}
          />
        </Box>
      </motion.div>

      {/* ── Per-question breakdown ─────────────────────────────────────────── */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Détails par question
      </Typography>

      <Stack sx={{ gap: 3 }}>
        {game.questions.map((question, qIdx) => {
          const truth = game.groundTruth?.[question.id]
          const judgeRank = game.judgeRankings?.[question.id]
          if (!truth || !judgeRank) return null
          return (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: qIdx * 0.15 }}
            >
              <QuestionComparison
                question={question}
                players={players}
                truth={truth}
                judgeRank={judgeRank}
              />
            </motion.div>
          )
        })}
      </Stack>
    </Box>
  )
}
