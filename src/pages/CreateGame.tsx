import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import ContentCopyIcon from "@mui/icons-material/ContentCopy"
import AddIcon from "@mui/icons-material/Add"
import DeleteIcon from "@mui/icons-material/Delete"
import { useRankIt } from "../hooks/useRankIt"
import { createGame } from "../services/game.service"
import { generateGameCode } from "../utils/gameCode"
import type { Player, Question } from "../types/types"

export function CreateGame() {
  const navigate = useNavigate()
  const { setPlayer, setGameCode } = useRankIt()

  const [code] = useState(() => generateGameCode())
  const [gameName, setGameName] = useState("")
  const [playerName, setPlayerName] = useState("")
  const [role, setRole] = useState<"player" | "judge">("player")
  const [questions, setQuestions] = useState<string[]>(["Question 1", "Question 2", "Question 3"])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const canSubmit =
    gameName.trim().length > 0 &&
    playerName.trim().length > 0 &&
    questions.some((q) => q.trim().length > 0) &&
    !loading

  const handleAddQuestion = () => setQuestions([...questions, ""])
  const handleRemoveQuestion = (i: number) =>
    setQuestions(questions.filter((_, idx) => idx !== i))
  const handleQuestionChange = (i: number, text: string) =>
    setQuestions(questions.map((q, idx) => (idx === i ? text : q)))

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCreate = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const playerId = crypto.randomUUID()
      const master: Player = { id: playerId, name: playerName.trim(), role }
      const validQuestions: Question[] = questions
        .filter((q) => q.trim().length > 0)
        .map((q) => ({ id: crypto.randomUUID(), text: q.trim() }))

      await createGame(code, gameName.trim(), master, validQuestions)
      setPlayer(master)
      setGameCode(code)
      navigate(`/game/${code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game.")
      setLoading(false)
    }
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background: `linear-gradient(180deg, ${theme.palette.background.default} 0%, ${theme.palette.background.paper} 100%)`,
      })}
    >
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{ mb: 3, color: "text.secondary", textTransform: "none" }}
        >
          Back
        </Button>

        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Create a Game
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Set up your game and share the code with friends.
        </Typography>

        {/* Game code */}
        <Box
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            background: alpha(theme.palette.primary.main, 0.08),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          })}
        >
          <Box>
            <Typography variant="caption" color="text.secondary">
              Game Code
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800, letterSpacing: 6, color: "primary.main", lineHeight: 1.2 }}
            >
              {code}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={handleCopy}
            sx={{ textTransform: "none", borderColor: "primary.main", color: "primary.main" }}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </Box>

        <TextField
          fullWidth
          label="Game Name"
          placeholder="e.g. Soirée du samedi"
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          inputProps={{ maxLength: 50 }}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Your Name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          inputProps={{ maxLength: 30 }}
          sx={{ mb: 2 }}
        />

        {/* Role selection */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Your role
        </Typography>
        <Stack direction="row" sx={{ gap: 1, mb: 3 }}>
          {(["player", "judge"] as const).map((r) => (
            <Button
              key={r}
              variant={role === r ? "contained" : "outlined"}
              onClick={() => setRole(r)}
              sx={{ textTransform: "capitalize", flex: 1 }}
            >
              {r}
            </Button>
          ))}
        </Stack>

        {/* Questions */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Questions (players will rank each other on these)
        </Typography>
        <Stack sx={{ gap: 1.5, mb: 3 }}>
          {questions.map((q, i) => (
            <Stack key={i} direction="row" sx={{ gap: 1, alignItems: "center" }}>
              <TextField
                fullWidth
                size="small"
                placeholder={`e.g. "Le plus courageux"`}
                value={q}
                onChange={(e) => handleQuestionChange(i, e.target.value)}
                inputProps={{ maxLength: 100 }}
              />
              {questions.length > 1 && (
                <IconButton size="small" onClick={() => handleRemoveQuestion(i)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          ))}
          <Button
            startIcon={<AddIcon />}
            onClick={handleAddQuestion}
            sx={{ alignSelf: "flex-start", textTransform: "none" }}
          >
            Add question
          </Button>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={!canSubmit}
          onClick={handleCreate}
          sx={(theme) => ({
            py: 1.5,
            textTransform: "none",
            fontWeight: 600,
            fontSize: "1rem",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${alpha(theme.palette.primary.main, 0.73)} 100%)`,
          })}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Create Game"}
        </Button>
      </Container>
    </Box>
  )
}
