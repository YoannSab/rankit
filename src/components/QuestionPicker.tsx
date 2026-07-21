import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material"
import { alpha } from "@mui/material/styles"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined"
import { useQuestionBank } from "../hooks/useQuestionBank"
import { deleteBankQuestion } from "../services/questionBank.service"

interface QuestionPickerProps {
  /** Set of question texts currently selected (checked). */
  selected: Set<string>
  /** Called when a suggested question is checked or unchecked. */
  onToggle: (text: string) => void
}

/**
 * Lets the user pick suggested questions from the shared question bank.
 * Each category is a collapsible section containing checkboxes; selecting
 * one adds its text to the game's question list (handled by the parent).
 * A trash icon removes a question from the shared bank.
 */
export function QuestionPicker({ selected, onToggle }: QuestionPickerProps) {
  const categories = useQuestionBank()

  if (categories.length === 0) return null

  return (
    <Stack sx={{ gap: 1, mb: 3 }}>
      {categories.map((category) => {
        const selectedCount = category.questions.filter((q) =>
          selected.has(q.text),
        ).length

        return (
          <Accordion
            key={category.id}
            disableGutters
            elevation={0}
            sx={(theme) => ({
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
              background: alpha(theme.palette.primary.main, 0.04),
              "&:before": { display: "none" },
            })}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Stack
                direction="row"
                sx={{ alignItems: "center", gap: 1, flexWrap: "wrap" }}
              >
                <Typography sx={{ fontWeight: 600 }}>{category.label}</Typography>
                {selectedCount > 0 && (
                  <Chip
                    size="small"
                    color="primary"
                    label={selectedCount}
                    sx={{ height: 20, fontWeight: 700 }}
                  />
                )}
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Stack>
                {category.questions.map((question) => (
                  <Stack
                    key={question.id}
                    direction="row"
                    sx={{ alignItems: "flex-start", gap: 0.5 }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={selected.has(question.text)}
                          onChange={() => onToggle(question.text)}
                          sx={{ py: 0.5 }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ py: 0.5 }}>
                          {question.text}
                        </Typography>
                      }
                      sx={{ alignItems: "flex-start", mr: 0, flex: 1 }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => deleteBankQuestion(category.id, question.id)}
                      sx={{ mt: 0.25, color: "text.disabled", "&:hover": { color: "error.main" } }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )
      })}
    </Stack>
  )
}
