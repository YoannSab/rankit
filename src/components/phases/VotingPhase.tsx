import { useState, useEffect } from "react"
import { Box, Button, Chip, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import { motion, Reorder, AnimatePresence } from "framer-motion"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import { useRankIt } from "../../hooks/useRankIt"
import { submitVote, setGroundTruth, advanceQuestion, updateGameState } from "../../services/game.service"
import type { Player, Ranking } from "../../types/types"

export function VotingPhase() {
  const { game, gameCode, player, isMaster } = useRankIt()

  const currentQuestionIndex = game?.state.currentQuestionIndex ?? 0
  const allPlayers = game?.players.filter((p) => p.role === "player") ?? []

  const [ranking, setRanking] = useState<Player[]>(allPlayers)

  // Reset ranking order when question changes
  useEffect(() => {
    if (allPlayers.length > 0) {
      setRanking([...allPlayers])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex])

  if (!game || !gameCode || !player) return null

  const currentQuestion = game.questions[currentQuestionIndex]
  const isJudge = player.role === "judge"

  // Derive submitted from Firebase — survives refresh
  const submitted = !!(game.playerVotes?.[currentQuestion?.id]?.[player.id])

  // Master can only advance once every player has submitted for this question
  const playerIds = allPlayers.map((p) => p.id)
  const votesForQuestion = game.playerVotes?.[currentQuestion?.id] ?? {}
  const allSubmitted = playerIds.length > 0 && playerIds.every((id) => !!votesForQuestion[id])

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (isJudge || submitted) return
    const rankingMap: Ranking = {}
    ranking.forEach((p, idx) => {
      rankingMap[p.id] = idx + 1
    })
    await submitVote(gameCode, currentQuestion.id, player.id, rankingMap)
  }

  // ── Master advance ───────────────────────────────────────────────────────────

  const handleNextQuestion = async () => {
    const nextIndex = currentQuestionIndex + 1
    if (nextIndex < game.questions.length) {
      await advanceQuestion(gameCode, nextIndex)
    } else {
      await computeAndSetGroundTruth()
      await updateGameState(gameCode, {
        phase: "judging",
        currentQuestionIndex: 0,
        judgingSubPhase: "ranking",
        judgingAttempt: 1,
      })
    }
  }

  const computeAndSetGroundTruth = async () => {
    if (!game.playerVotes) return
    const players = game.players.filter((p) => p.role === "player")
    const truth: Record<string, Ranking> = {}

    for (const question of game.questions) {
      const votesForQ = game.playerVotes[question.id]
      if (!votesForQ) continue

      const totals: Record<string, number> = {}
      const counts: Record<string, number> = {}

      for (const voterRanking of Object.values(votesForQ)) {
        for (const [playerId, rank] of Object.entries(voterRanking)) {
          totals[playerId] = (totals[playerId] ?? 0) + rank
          counts[playerId] = (counts[playerId] ?? 0) + 1
        }
      }

      const averages = players
        .filter((p) => counts[p.id])
        .map((p) => ({ id: p.id, avg: totals[p.id] / counts[p.id] }))
        .sort((a, b) => a.avg - b.avg)

      const r: Ranking = {}
      averages.forEach((entry, idx) => {
        r[entry.id] = idx + 1
      })
      truth[question.id] = r
    }

    await setGroundTruth(gameCode, truth)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (isJudge) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Vote en cours…
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Les joueurs se classent entre eux. Patientez.
          </Typography>
          <Box sx={(theme) => ({ mt: 3, p: 2, borderRadius: 2, background: alpha(theme.palette.primary.main, 0.06) })}>
            <Typography variant="body2" color="text.secondary">
              Question {currentQuestionIndex + 1}/{game.questions.length} : <strong>{currentQuestion?.text}</strong>
            </Typography>
          </Box>
        </motion.div>
      </Box>
    )
  }

  return (
    <Box>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <Chip
            label={`Question ${currentQuestionIndex + 1}/${game.questions.length}`}
            color="primary"
            size="small"
            sx={{ mb: 1.5, fontWeight: 600 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {currentQuestion?.text}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Classez tous les joueurs (vous inclus). Glissez pour réordonner.
          </Typography>
        </Box>
      </motion.div>

      {!submitted ? (
        <>
          <Reorder.Group
            axis="y"
            values={ranking}
            onReorder={setRanking}
            style={{ listStyle: "none", padding: 0, margin: 0 }}
          >
            <AnimatePresence>
              {ranking.map((p, i) => (
                <Reorder.Item
                  key={p.id}
                  value={p}
                  style={{ marginBottom: 8 }}
                  whileDrag={{
                    scale: 1.03,
                    boxShadow: "0 8px 32px rgba(124,58,237,0.25)",
                    cursor: "grabbing",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                  <Box
                    sx={(theme) => ({
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 2.5,
                      py: 2,
                      borderRadius: 2,
                      cursor: "grab",
                      userSelect: "none",
                      background: alpha(theme.palette.common.white, 0.03),
                      border: `1px solid ${alpha(theme.palette.common.white, 0.08)}`,
                      transition: "border-color 0.2s, background 0.2s",
                      "&:hover": {
                        borderColor: alpha(theme.palette.primary.main, 0.4),
                        background: alpha(theme.palette.primary.main, 0.04),
                      },
                    })}
                  >
                    <DragIndicatorIcon sx={{ color: "text.disabled", fontSize: 22 }} />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 800, color: "primary.main", minWidth: 32, textAlign: "center" }}
                    >
                      {i + 1}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                      {p.name}
                      {p.id === player.id && (
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                          (vous)
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Reorder.Item>
              ))}
            </AnimatePresence>
          </Reorder.Group>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSubmit}
              sx={(theme) => ({
                mt: 3,
                textTransform: "none",
                fontWeight: 700,
                py: 1.8,
                borderRadius: 2,
                fontSize: "1rem",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              })}
            >
              Valider mon classement
            </Button>
          </motion.div>
        </>
      ) : (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <Box sx={(theme) => ({ p: 3, borderRadius: 2, textAlign: "center", background: alpha(theme.palette.secondary.main, 0.08) })}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              ✓ Classement envoyé ! En attente des autres joueurs…
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Master controls */}
      {isMaster && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Box sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={handleNextQuestion}
              disabled={!allSubmitted}
              sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}
            >
              {currentQuestionIndex < game.questions.length - 1
                ? "Question suivante →"
                : "Terminer le vote & passer au jugement"}
            </Button>
            {!allSubmitted && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
                En attente… ({Object.keys(votesForQuestion).length}/{playerIds.length})
              </Typography>
            )}
          </Box>
        </motion.div>
      )}
    </Box>
  )
}

