import { useState, useEffect, useCallback, useRef } from "react"
import { Box, Button, Chip, Stack, Typography, LinearProgress } from "@mui/material"
import { alpha, keyframes } from "@mui/material/styles"
import { motion, AnimatePresence } from "framer-motion"
import ReplayIcon from "@mui/icons-material/Replay"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import LockIcon from "@mui/icons-material/Lock"
import { useRankIt } from "../../hooks/useRankIt"
import {
  updateLiveJudgeRanking,
  submitJudgeRanking,
  setJudgingSubPhase,
  nextJudgingQuestion,
} from "../../services/game.service"
import { useRealtimeValue } from "../../hooks/useRealtimeValue"
import { ReorderAvatarGrid } from "../ReorderAvatarGrid"
import { AvatarRankTile } from "../AvatarRankTile"
import { useAvatarViewer } from "../AvatarViewer"
import type { Player, Ranking } from "../../types/types"

// ── Keyframe animations ───────────────────────────────────────────────────────

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 24px 6px rgba(124, 58, 237, 0.35); }
`

// ── Main Component ────────────────────────────────────────────────────────────

export function JudgingPhase() {
  const { game, gameCode, player, isMaster } = useRankIt()
  const { open: openAvatar } = useAvatarViewer()

  const currentQuestionIndex = game?.state.currentQuestionIndex ?? 0
  const subPhase = game?.state.judgingSubPhase ?? "ranking"
  const attempt = game?.state.judgingAttempt ?? 1
  const currentQuestion = game?.questions[currentQuestionIndex]
  const playersToRank = game?.players.filter((p) => p.role === "player") ?? []
  const isJudge = player?.role === "judge"

  // Live order synced via Firebase
  const [liveOrder] = useRealtimeValue<string[]>(
    gameCode && currentQuestion
      ? `games/${gameCode}/liveJudgeOrder/${currentQuestion.id}`
      : null,
  )

  // Local order for optimistic UI
  const [localOrder, setLocalOrder] = useState<Player[]>(playersToRank)
  const [revealedItems, setRevealedItems] = useState<Set<number>>(new Set())
  const revealTimerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Sync from Firebase live order
  useEffect(() => {
    if (liveOrder && liveOrder.length > 0 && playersToRank.length > 0) {
      const ordered = liveOrder
        .map((id) => playersToRank.find((p) => p.id === id))
        .filter(Boolean) as Player[]
      if (ordered.length === playersToRank.length) {
        setLocalOrder(ordered)
      }
    } else if (playersToRank.length > 0 && !liveOrder) {
      setLocalOrder([...playersToRank])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveOrder, currentQuestionIndex])

  // Auto-reveal animation when entering "revealed" phase
  useEffect(() => {
    if (subPhase === "revealed") {
      setRevealedItems(new Set())
      revealTimerRef.current.forEach(clearTimeout)
      revealTimerRef.current = []
      // Theatrical reveal: one by one
      localOrder.forEach((_, i) => {
        const timer = setTimeout(() => {
          setRevealedItems((prev) => new Set([...prev, i]))
        }, i * 500 + 400)
        revealTimerRef.current.push(timer)
      })
    }
    if (subPhase === "ranking") {
      setRevealedItems(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subPhase, currentQuestionIndex, attempt])

  // Cleanup timers
  useEffect(() => {
    return () => revealTimerRef.current.forEach(clearTimeout)
  }, [])

  const handleReorder = useCallback(
    (newOrder: Player[]) => {
      if (!gameCode || !currentQuestion || subPhase !== "ranking") return
      setLocalOrder(newOrder)
      const ids = newOrder.map((p) => p.id)
      updateLiveJudgeRanking(gameCode, currentQuestion.id, ids)
    },
    [gameCode, currentQuestion, subPhase],
  )

  if (!game || !gameCode || !player || !currentQuestion) return null

  const groundTruth = game.groundTruth?.[currentQuestion.id]

  // ── Compute correctness ─────────────────────────────────────────────────────

  const getCorrectness = (playerId: string, position: number): boolean | null => {
    if (!groundTruth) return null
    return groundTruth[playerId] === position + 1
  }

  // ── Actions (master only) ───────────────────────────────────────────────────

  const handleLockAndReveal = async () => {
    const rankingMap: Ranking = {}
    localOrder.forEach((p, idx) => {
      rankingMap[p.id] = idx + 1
    })
    await submitJudgeRanking(gameCode, currentQuestion.id, rankingMap)
    await setJudgingSubPhase(gameCode, "revealed", attempt)
  }

  const handleRetry = async () => {
    await setJudgingSubPhase(gameCode, "ranking", attempt + 1)
  }

  const handleNextQuestion = async () => {
    await nextJudgingQuestion(gameCode)
  }

  // ── Compute score for revealed phase ────────────────────────────────────────

  const correctCount = localOrder.filter((p, i) => getCorrectness(p.id, i) === true).length
  const hasErrors = correctCount < localOrder.length
  const allRevealed = revealedItems.size >= localOrder.length
  const scorePercent = localOrder.length > 0 ? Math.round((correctCount / localOrder.length) * 100) : 0

  // ── Render: Revealed phase ─────────────────────────────────────────────────

  if (subPhase === "revealed") {
    return (
      <Box>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Chip
              label={`Question ${currentQuestionIndex + 1}/${game.questions.length}`}
              color="primary"
              size="small"
              sx={{ mb: 1, fontWeight: 600 }}
            />
            {attempt > 1 && (
              <Chip
                label={`Tentative ${attempt}`}
                color="secondary"
                size="small"
                variant="outlined"
                sx={{ ml: 1, mb: 1, fontWeight: 600 }}
              />
            )}
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>
              Résultats
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {currentQuestion.text}
            </Typography>
          </Box>
        </motion.div>

        {/* Score bar (appears after full reveal) */}
        <AnimatePresence>
          {allRevealed && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Box
                sx={(theme) => ({
                  mb: 3,
                  p: 2.5,
                  borderRadius: 3,
                  textAlign: "center",
                  background: !hasErrors
                    ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)}, ${alpha(theme.palette.success.main, 0.05)})`
                    : `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.background.paper, 0.8)})`,
                  border: `1px solid ${alpha(!hasErrors ? theme.palette.success.main : theme.palette.warning.main, 0.3)}`,
                })}
              >
                <Typography variant="h3" sx={{ fontWeight: 900, color: !hasErrors ? "success.main" : "warning.main" }}>
                  {scorePercent}%
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.secondary", mb: 1.5 }}>
                  {correctCount}/{localOrder.length} bien placé{correctCount > 1 ? "s" : ""}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={scorePercent}
                  sx={(theme) => ({
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.common.white, 0.08),
                    "& .MuiLinearProgress-bar": {
                      borderRadius: 4,
                      background: !hasErrors
                        ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                        : `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                    },
                  })}
                />
                {!hasErrors && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 500 }}
                  >
                    <Typography variant="body1" sx={{ mt: 1.5, fontWeight: 700, color: "success.main" }}>
                      🎉 Parfait !
                    </Typography>
                  </motion.div>
                )}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ranking grid with reveal */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
            gap: 1.5,
            justifyItems: "center",
            mb: 4,
          }}
        >
          {localOrder.map((p, i) => {
            const revealed = revealedItems.has(i)
            const correct = getCorrectness(p.id, i)

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0.3, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.5 + 0.3, type: "spring", stiffness: 220, damping: 18 }}
                style={{ width: "100%", display: "flex", justifyContent: "center" }}
              >
                <AvatarRankTile
                  player={p}
                  rank={i + 1}
                  pending={!revealed}
                  status={revealed ? (correct ? "correct" : "wrong") : undefined}
                />
              </motion.div>
            )
          })}
        </Box>

        {/* Master-only actions after full reveal */}
        {allRevealed && isMaster && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
          >
            <Stack sx={{ gap: 2 }}>
              {hasErrors && (
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<ReplayIcon />}
                  onClick={handleRetry}
                  sx={(theme) => ({
                    textTransform: "none",
                    fontWeight: 600,
                    py: 1.5,
                    borderRadius: 2.5,
                    borderColor: alpha(theme.palette.secondary.main, 0.6),
                    color: theme.palette.secondary.main,
                    "&:hover": {
                      background: alpha(theme.palette.secondary.main, 0.08),
                      borderColor: theme.palette.secondary.main,
                    },
                  })}
                >
                  Retenter le classement
                </Button>
              )}
              <Button
                variant="contained"
                size="large"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                onClick={handleNextQuestion}
                sx={(theme) => ({
                  textTransform: "none",
                  fontWeight: 700,
                  py: 1.8,
                  borderRadius: 2.5,
                  fontSize: "1rem",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
                  "&:hover": {
                    boxShadow: `0 6px 28px ${alpha(theme.palette.primary.main, 0.4)}`,
                  },
                })}
              >
                {currentQuestionIndex < game.questions.length - 1
                  ? `Question suivante`
                  : "Résultats finaux 🏆"}
              </Button>
            </Stack>
          </motion.div>
        )}
      </Box>
    )
  }

  // ── Render: Ranking (Drag & Drop) ──────────────────────────────────────────

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
          {attempt > 1 && (
            <Chip
              label={`Tentative ${attempt}`}
              color="secondary"
              size="small"
              variant="outlined"
              sx={{ ml: 1, mb: 1.5, fontWeight: 600 }}
            />
          )}
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {currentQuestion.text}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isJudge
              ? "Discutez ensemble et classez les joueurs. Le classement est synchronisé en temps réel."
              : "Les juges classent les joueurs en temps réel…"}
          </Typography>
        </Box>
      </motion.div>

      {/* Drag grid — judges can reorder, others watch */}
      {isJudge ? (
        <ReorderAvatarGrid
          items={localOrder}
          onReorder={handleReorder}
          draggable
          onTileTap={(p) => openAvatar(p)}
          renderTile={(p, i) => (
            <AvatarRankTile
              player={p}
              rank={i + 1}
              disableViewer
              subtitle={
                attempt > 1 && game.judgeRankings?.[currentQuestion.id]
                  ? `Avant #${game.judgeRankings[currentQuestion.id][p.id] ?? "?"}`
                  : undefined
              }
            />
          )}
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(104px, 1fr))",
            gap: 1.5,
            justifyItems: "center",
          }}
        >
          {localOrder.map((p, i) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 28 }}
              style={{ width: "100%", display: "flex", justifyContent: "center" }}
            >
              <AvatarRankTile player={p} rank={i + 1} />
            </motion.div>
          ))}
        </Box>
      )}

      {/* Lock & Reveal button — MASTER ONLY */}
      {isMaster && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<LockIcon />}
            onClick={handleLockAndReveal}
            sx={(theme) => ({
              mt: 4,
              textTransform: "none",
              fontWeight: 700,
              py: 2,
              borderRadius: 2.5,
              fontSize: "1.05rem",
              animation: `${pulseGlow} 2.5s ease-in-out infinite`,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
              "&:hover": {
                boxShadow: `0 6px 28px ${alpha(theme.palette.primary.main, 0.45)}`,
              },
            })}
          >
            Valider & Révéler
          </Button>
        </motion.div>
      )}
    </Box>
  )
}
