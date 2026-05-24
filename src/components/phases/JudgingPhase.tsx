import { useState, useEffect, useCallback, useRef } from "react"
import { Box, Button, Chip, Stack, Typography } from "@mui/material"
import { alpha, keyframes } from "@mui/material/styles"
import { motion, Reorder, AnimatePresence } from "framer-motion"
import DragIndicatorIcon from "@mui/icons-material/DragIndicator"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"
import ReplayIcon from "@mui/icons-material/Replay"
import ArrowForwardIcon from "@mui/icons-material/ArrowForward"
import VisibilityIcon from "@mui/icons-material/Visibility"
import { useRankIt } from "../../hooks/useRankIt"
import {
  updateLiveJudgeRanking,
  submitJudgeRanking,
  setJudgingSubPhase,
  nextJudgingQuestion,
} from "../../services/game.service"
import { useRealtimeValue } from "../../hooks/useRealtimeValue"
import type { Player, Ranking } from "../../types/types"

// ── Keyframe animations ───────────────────────────────────────────────────────

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 20px 4px rgba(124, 58, 237, 0.3); }
`

// ── Main Component ────────────────────────────────────────────────────────────

export function JudgingPhase() {
  const { game, gameCode, player, isMaster } = useRankIt()

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
  const [isRevealing, setIsRevealing] = useState(false)
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

  // Reset reveal state on sub-phase change
  useEffect(() => {
    if (subPhase === "ranking") {
      setRevealedItems(new Set())
      setIsRevealing(false)
    }
  }, [subPhase, currentQuestionIndex])

  // Cleanup timers
  useEffect(() => {
    return () => revealTimerRef.current.forEach(clearTimeout)
  }, [])

  const handleReorder = useCallback(
    (newOrder: Player[]) => {
      if (!gameCode || !currentQuestion || subPhase !== "ranking") return
      setLocalOrder(newOrder)
      // Sync to Firebase
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

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleLockRanking = async () => {
    // Save the judge ranking and move to revealed
    const rankingMap: Ranking = {}
    localOrder.forEach((p, idx) => {
      rankingMap[p.id] = idx + 1
    })
    await submitJudgeRanking(gameCode, currentQuestion.id, rankingMap)
    await setJudgingSubPhase(gameCode, "revealed", attempt)
  }

  const handleReveal = () => {
    setIsRevealing(true)
    // Theatrical reveal: one by one with delay
    localOrder.forEach((_, i) => {
      const timer = setTimeout(() => {
        setRevealedItems((prev) => new Set([...prev, i]))
      }, i * 600 + 300)
      revealTimerRef.current.push(timer)
    })
  }

  const handleRetry = async () => {
    await setJudgingSubPhase(gameCode, "ranking", attempt + 1)
  }

  const handleShowTruth = async () => {
    await setJudgingSubPhase(gameCode, "showTruth", attempt)
  }

  const handleNextQuestion = async () => {
    await nextJudgingQuestion(gameCode)
  }

  // ── Render: Players wait ────────────────────────────────────────────────────

  if (!isJudge) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <EmojiEventsIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Les juges délibèrent…
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Ils essaient de deviner votre classement. Asseyez-vous et profitez du spectacle !
          </Typography>
          <Box sx={(theme) => ({ mt: 4, p: 2.5, borderRadius: 2, background: alpha(theme.palette.secondary.main, 0.06) })}>
            <Typography variant="body2" color="text.secondary">
              Question {currentQuestionIndex + 1}/{game.questions.length} : <strong>{currentQuestion.text}</strong>
            </Typography>
            <Chip
              label={`Tentative ${attempt}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          </Box>
        </motion.div>

        {/* Master controls even if master is a player */}
        {isMaster && subPhase === "ranking" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleLockRanking}
              sx={(theme) => ({
                mt: 4,
                textTransform: "none",
                fontWeight: 700,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              })}
            >
              Valider le classement des juges
            </Button>
          </motion.div>
        )}
        {isMaster && subPhase === "revealed" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Stack sx={{ mt: 4, gap: 2, alignItems: "center" }}>
              <Button variant="outlined" startIcon={<ReplayIcon />} onClick={handleRetry} sx={{ textTransform: "none", fontWeight: 600 }}>
                Retenter un classement
              </Button>
              <Button variant="contained" startIcon={<EmojiEventsIcon />} onClick={handleShowTruth} sx={(theme) => ({ textTransform: "none", fontWeight: 700, background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})` })}>
                Révéler le vrai classement
              </Button>
            </Stack>
          </motion.div>
        )}
        {isMaster && subPhase === "showTruth" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNextQuestion}
              sx={(theme) => ({
                mt: 4,
                textTransform: "none",
                fontWeight: 700,
                py: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              })}
            >
              {currentQuestionIndex < game.questions.length - 1 ? "Question suivante" : "Résultats finaux"}
            </Button>
          </motion.div>
        )}
      </Box>
    )
  }

  // ── Render: Show Truth ──────────────────────────────────────────────────────

  if (subPhase === "showTruth") {
    // Sort by ground truth
    const truthSorted = [...playersToRank].sort(
      (a, b) => (groundTruth?.[a.id] ?? 99) - (groundTruth?.[b.id] ?? 99),
    )
    const judgeRanking = game.judgeRankings?.[currentQuestion.id]

    return (
      <Box>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
            🏆 Le vrai classement
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
            Question : {currentQuestion.text}
          </Typography>
        </motion.div>

        <Stack sx={{ gap: 1.5, mb: 4 }}>
          {truthSorted.map((p, i) => {
            const judgePos = judgeRanking?.[p.id]
            const correct = judgePos === i + 1

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15, type: "spring", stiffness: 300 }}
              >
                <Box
                  sx={(theme) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: 2.5,
                    py: 2,
                    borderRadius: 2,
                    background: alpha(theme.palette.success.main, 0.08),
                    border: `2px solid ${alpha(theme.palette.success.main, 0.4)}`,
                  })}
                >
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 800, color: "success.main", minWidth: 36, textAlign: "center" }}
                  >
                    {i + 1}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                    {p.name}
                  </Typography>
                  {judgePos && (
                    <Chip
                      icon={correct ? <CheckCircleIcon /> : <CancelIcon />}
                      label={`Vous : #${judgePos}`}
                      size="small"
                      color={correct ? "success" : "error"}
                      variant="outlined"
                    />
                  )}
                </Box>
              </motion.div>
            )
          })}
        </Stack>

        {/* Any judge or master: next question */}
        {(isMaster || isJudge) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={handleNextQuestion}
              sx={(theme) => ({
                textTransform: "none",
                fontWeight: 700,
                py: 1.8,
                borderRadius: 2,
                fontSize: "1rem",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              })}
            >
              {currentQuestionIndex < game.questions.length - 1
                ? `Question suivante (${currentQuestionIndex + 2}/${game.questions.length})`
                : "Voir les résultats finaux"}
            </Button>
          </motion.div>
        )}
      </Box>
    )
  }

  // ── Render: Revealed (green/red) ───────────────────────────────────────────

  if (subPhase === "revealed") {
    const allRevealed = revealedItems.size >= localOrder.length

    return (
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, textAlign: "center" }}>
          Résultat — Tentative {attempt}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
          {currentQuestion.text}
        </Typography>

        {!isRevealing ? (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                Prêts à découvrir vos résultats ?
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<VisibilityIcon />}
                onClick={handleReveal}
                sx={(theme) => ({
                  textTransform: "none",
                  fontWeight: 700,
                  px: 5,
                  py: 1.8,
                  borderRadius: 3,
                  fontSize: "1.1rem",
                  animation: `${pulseGlow} 2s ease-in-out infinite`,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                })}
              >
                Révéler le classement
              </Button>
            </Box>
          </motion.div>
        ) : (
          <>
            <Stack sx={{ gap: 1.5, mb: 4 }}>
              {localOrder.map((p, i) => {
                const revealed = revealedItems.has(i)
                const correct = getCorrectness(p.id, i)

                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.6 + 0.2 }}
                  >
                    <Box
                      sx={(theme) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        px: 2.5,
                        py: 2,
                        borderRadius: 2,
                        transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                        ...(revealed
                          ? {
                              background: correct
                                ? alpha(theme.palette.success.main, 0.1)
                                : alpha(theme.palette.error.main, 0.1),
                              border: `2px solid ${correct
                                ? alpha(theme.palette.success.main, 0.5)
                                : alpha(theme.palette.error.main, 0.5)
                              }`,
                              boxShadow: correct
                                ? `0 0 16px ${alpha(theme.palette.success.main, 0.2)}`
                                : `0 0 16px ${alpha(theme.palette.error.main, 0.15)}`,
                            }
                          : {
                              background: alpha(theme.palette.common.white, 0.03),
                              border: `2px solid ${alpha(theme.palette.common.white, 0.08)}`,
                              // Shimmer effect while waiting
                              backgroundImage: `linear-gradient(90deg, transparent 30%, ${alpha(theme.palette.primary.main, 0.08)} 50%, transparent 70%)`,
                              backgroundSize: "200% 100%",
                              animation: `${shimmer} 1.5s ease-in-out infinite`,
                            }),
                      })}
                    >
                      <Typography
                        variant="h6"
                        sx={(theme) => ({
                          fontWeight: 800,
                          minWidth: 36,
                          textAlign: "center",
                          color: revealed
                            ? correct
                              ? theme.palette.success.main
                              : theme.palette.error.main
                            : theme.palette.text.secondary,
                        })}
                      >
                        {i + 1}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600, flex: 1 }}>
                        {p.name}
                      </Typography>
                      <AnimatePresence>
                        {revealed && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            {correct ? (
                              <CheckCircleIcon sx={{ color: "success.main", fontSize: 28 }} />
                            ) : (
                              <CancelIcon sx={{ color: "error.main", fontSize: 28 }} />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </Box>
                  </motion.div>
                )
              })}
            </Stack>

            {/* Actions after full reveal */}
            {allRevealed && (isMaster || isJudge) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Stack sx={{ gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<ReplayIcon />}
                    onClick={handleRetry}
                    sx={(theme) => ({
                      textTransform: "none",
                      fontWeight: 600,
                      py: 1.5,
                      borderRadius: 2,
                      borderColor: theme.palette.secondary.main,
                      color: theme.palette.secondary.main,
                      "&:hover": {
                        background: alpha(theme.palette.secondary.main, 0.08),
                        borderColor: theme.palette.secondary.main,
                      },
                    })}
                  >
                    Retenter un classement
                  </Button>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<EmojiEventsIcon />}
                    onClick={handleShowTruth}
                    sx={(theme) => ({
                      textTransform: "none",
                      fontWeight: 700,
                      py: 1.5,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    })}
                  >
                    Révéler le vrai classement
                  </Button>
                </Stack>
              </motion.div>
            )}
          </>
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
            Discutez ensemble et classez les joueurs. Le classement est synchronisé en temps réel.
          </Typography>
        </Box>
      </motion.div>

      <Reorder.Group
        axis="y"
        values={localOrder}
        onReorder={handleReorder}
        style={{ listStyle: "none", padding: 0, margin: 0 }}
      >
        <AnimatePresence>
          {localOrder.map((p, i) => (
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
                </Typography>
                {/* Visual hint from previous attempts */}
                {attempt > 1 && game.judgeRankings?.[currentQuestion.id] && (
                  <Chip
                    label={`Avant: #${game.judgeRankings[currentQuestion.id][p.id] ?? "?"}`}
                    size="small"
                    variant="outlined"
                    sx={{ opacity: 0.6 }}
                  />
                )}
              </Box>
            </Reorder.Item>
          ))}
        </AnimatePresence>
      </Reorder.Group>

      {/* Any judge (or master) can lock ranking */}
      {(isMaster || isJudge) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleLockRanking}
            sx={(theme) => ({
              mt: 4,
              textTransform: "none",
              fontWeight: 700,
              py: 1.8,
              borderRadius: 2,
              fontSize: "1rem",
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            })}
          >
            Valider le classement des juges
          </Button>
        </motion.div>
      )}
    </Box>
  )
}
