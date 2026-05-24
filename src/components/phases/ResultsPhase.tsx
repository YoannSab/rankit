import { Box, Chip, Divider, LinearProgress, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { motion } from "framer-motion"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import StarIcon from "@mui/icons-material/Star"
import { useRankIt } from "../../hooks/useRankIt"

export function ResultsPhase() {
  const { game } = useRankIt()
  if (!game) return null

  const players = game.players.filter((p) => p.role === "player")

  // ── Compute global score ────────────────────────────────────────────────────

  let totalPlacements = 0
  let correctPlacements = 0

  const questionResults = game.questions.map((question) => {
    const truth = game.groundTruth?.[question.id]
    const judgeRank = game.judgeRankings?.[question.id]
    if (!truth || !judgeRank) return { question, correct: 0, total: 0, details: [] }

    const details = players.map((p) => {
      const truePos = truth[p.id]
      const judgePos = judgeRank[p.id]
      const isCorrect = truePos === judgePos
      if (isCorrect) correctPlacements++
      totalPlacements++
      return { player: p, truePos, judgePos, isCorrect }
    })

    const correct = details.filter((d) => d.isCorrect).length
    return { question, correct, total: details.length, details }
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
            py: 5,
            px: 3,
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          })}
        >
          <EmojiEventsIcon sx={{ fontSize: 56, color: "warning.main", mb: 1 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
            {tier.emoji} {tier.label}
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, color: "primary.main", mb: 1 }}>
            {accuracy}%
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {correctPlacements} placement{correctPlacements !== 1 ? "s" : ""} correct{correctPlacements !== 1 ? "s" : ""} sur {totalPlacements}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={accuracy}
            sx={(theme) => ({
              mt: 2,
              mx: "auto",
              maxWidth: 300,
              height: 10,
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
        {questionResults.map(({ question, correct, total, details }, qIdx) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qIdx * 0.15 }}
          >
            <Box
              sx={(theme) => ({
                p: 2.5,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                background: alpha(theme.palette.common.white, 0.02),
              })}
            >
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {question.text}
                </Typography>
                <Chip
                  icon={<StarIcon />}
                  label={`${correct}/${total}`}
                  size="small"
                  color={correct === total ? "success" : correct > 0 ? "primary" : "error"}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Divider sx={{ mb: 1.5, opacity: 0.3 }} />

              <Stack sx={{ gap: 0.75 }}>
                {details
                  .sort((a, b) => (a.truePos ?? 99) - (b.truePos ?? 99))
                  .map((d) => (
                    <Stack
                      key={d.player.id}
                      direction="row"
                      sx={(theme) => ({
                        alignItems: "center",
                        gap: 1.5,
                        px: 2,
                        py: 1,
                        borderRadius: 1.5,
                        background: d.isCorrect
                          ? alpha(theme.palette.success.main, 0.06)
                          : alpha(theme.palette.error.main, 0.04),
                      })}
                    >
                      {d.isCorrect ? (
                        <CheckCircleIcon sx={{ color: "success.main", fontSize: 18 }} />
                      ) : (
                        <CancelIcon sx={{ color: "error.main", fontSize: 18 }} />
                      )}
                      <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                        {d.player.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vrai: #{d.truePos}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: d.isCorrect ? "success.main" : "error.main", fontWeight: 600 }}
                      >
                        Juges: #{d.judgePos ?? "—"}
                      </Typography>
                    </Stack>
                  ))}
              </Stack>
            </Box>
          </motion.div>
        ))}
      </Stack>
    </Box>
  )
}
