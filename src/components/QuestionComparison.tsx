import { Box, Chip, Divider, Stack, Typography } from "@mui/material"
import { alpha } from "@mui/material/styles"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CancelIcon from "@mui/icons-material/Cancel"
import StarIcon from "@mui/icons-material/Star"
import { PlayerAvatar } from "./PlayerAvatar"
import type { Player, Question, Ranking } from "../types/types"

const podiumColors = ["#FFD700", "#C0C0C0", "#CD7F32"] // gold, silver, bronze

interface QuestionComparisonProps {
  question: Question
  players: Player[]
  /** True ranking derived from players' votes (playerId → rank). */
  truth: Ranking
  /** Judges' submitted ranking (playerId → rank). */
  judgeRank: Ranking
  /** Whether to show the question text in the header. */
  showQuestionText?: boolean
}

/**
 * Side-by-side comparison of the true player ranking versus the judges'
 * ranking for a single question, with per-position correctness badges.
 * Shared between the per-question results and the in-game reveal.
 */
export function QuestionComparison({
  question,
  players,
  truth,
  judgeRank,
  showQuestionText = true,
}: QuestionComparisonProps) {
  const details = players.map((p) => {
    const truePos = truth[p.id]
    const judgePos = judgeRank[p.id]
    return { player: p, truePos, judgePos, isCorrect: truePos === judgePos }
  })

  const correct = details.filter((d) => d.isCorrect).length
  const total = details.length
  const truthSorted = [...details].sort((a, b) => (a.truePos ?? 99) - (b.truePos ?? 99))
  const judgeSorted = [...details].sort((a, b) => (a.judgePos ?? 99) - (b.judgePos ?? 99))

  return (
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
        {showQuestionText ? (
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {question.text}
          </Typography>
        ) : (
          <span />
        )}
        <Chip
          icon={<StarIcon />}
          label={`${correct}/${total}`}
          size="small"
          color={correct === total ? "success" : correct > 0 ? "primary" : "error"}
          sx={{ fontWeight: 700, flexShrink: 0 }}
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
  )
}
