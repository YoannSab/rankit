import { Box, Chip, Divider, LinearProgress, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { motion } from "framer-motion"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import StarIcon from "@mui/icons-material/Star"
import { useRankIt } from "../../hooks/useRankIt"
import { PlayerAvatar } from "../PlayerAvatar"

// ── Podium colors ─────────────────────────────────────────────────────────────

const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"] // gold, silver, bronze

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
    if (!truth || !judgeRank) return { question, correct: 0, total: 0, truthSorted: [], judgeSorted: [] }

    const details = players.map((p) => {
      const truePos = truth[p.id]
      const judgePos = judgeRank[p.id]
      const isCorrect = truePos === judgePos
      if (isCorrect) correctPlacements++
      totalPlacements++
      return { player: p, truePos, judgePos, isCorrect }
    })

    const correct = details.filter((d) => d.isCorrect).length
    const truthSorted = [...details].sort((a, b) => (a.truePos ?? 99) - (b.truePos ?? 99))
    const judgeSorted = [...details].sort((a, b) => (a.judgePos ?? 99) - (b.judgePos ?? 99))
    return { question, correct, total: details.length, truthSorted, judgeSorted }
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
        {questionResults.map(({ question, correct, total, truthSorted, judgeSorted }, qIdx) => (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qIdx * 0.15 }}
          >
            <Box
              sx={(theme) => ({
                p: 2.5,
                borderRadius: 2.5,
                border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                background: alpha(theme.palette.common.white, 0.02),
              })}
            >
              {/* Question header */}
              <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
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

              {/* Column headers */}
              <Stack direction="row" sx={{ gap: 2, mb: 1 }}>
                <Typography variant="caption" sx={{ flex: 1, textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "success.main" }}>
                  Vrai classement
                </Typography>
                <Typography variant="caption" sx={{ flex: 1, textAlign: "center", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "primary.main" }}>
                  Classement des juges
                </Typography>
              </Stack>

              <Divider sx={{ mb: 1.5, opacity: 0.2 }} />

              {/* Side-by-side rankings */}
              <Stack direction="row" sx={{ gap: { xs: 1, sm: 2 }, alignItems: "flex-start" }}>
                {/* Left: true ranking */}
                <Stack sx={{ flex: 1, gap: 1.5 }}>
                  {truthSorted.map((d, i) => (
                    <Stack key={d.player.id} sx={{ alignItems: "center", gap: 0.75 }}>
                      <Box sx={{ position: "relative" }}>
                        <PlayerAvatar player={d.player} size={64} animate={false} ringColor="secondary" />
                        <Box
                          sx={{
                            position: "absolute",
                            bottom: -3,
                            left: -3,
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 900,
                            fontSize: "0.75rem",
                            color: i < 3 ? "#000" : "#fff",
                            background: i < 3 ? podiumColors[i] : "rgba(40,46,60,1)",
                            border: "2px solid",
                            borderColor: "background.paper",
                            boxShadow: i < 3 ? `0 2px 8px ${alpha(podiumColors[i], 0.5)}` : "none",
                          }}
                        >
                          {i + 1}
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.player.name}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                {/* Right: judge ranking */}
                <Stack sx={{ flex: 1, gap: 1.5 }}>
                  {judgeSorted.map((judgeEntry, i) => {
                    const isCorrect = truthSorted[i]?.player.id === judgeEntry?.player.id
                    return (
                      <Stack key={judgeEntry?.player.id ?? i} sx={{ alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ position: "relative" }}>
                          {judgeEntry?.player ? (
                            <PlayerAvatar
                              player={judgeEntry.player}
                              size={64}
                              animate={false}
                              ringColor={isCorrect ? "secondary" : "primary"}
                            />
                          ) : (
                            <Box sx={{ width: 68, height: 68 }} />
                          )}
                          {/* Rank badge */}
                          <Box
                            sx={(theme) => ({
                              position: "absolute",
                              bottom: -3,
                              left: -3,
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 900,
                              fontSize: "0.75rem",
                              color: "#fff",
                              background: isCorrect ? theme.palette.success.main : theme.palette.error.main,
                              border: `2px solid ${theme.palette.background.paper}`,
                            })}
                          >
                            {i + 1}
                          </Box>
                          {/* Correctness badge */}
                          <Box
                            sx={(theme) => ({
                              position: "absolute",
                              top: -4,
                              right: -4,
                              borderRadius: "50%",
                              background: theme.palette.background.paper,
                              display: "flex",
                            })}
                          >
                            {isCorrect ? (
                              <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
                            ) : (
                              <CancelIcon sx={{ color: "error.main", fontSize: 20 }} />
                            )}
                          </Box>
                        </Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {judgeEntry?.player.name ?? "—"}
                        </Typography>
                      </Stack>
                    )
                  })}
                </Stack>
              </Stack>
            </Box>
          </motion.div>
        ))}
      </Stack>
    </Box>
  )
}
