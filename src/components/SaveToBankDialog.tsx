import { useEffect, useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { useQuestionBank } from "../hooks/useQuestionBank"
import { addBankCategory, addBankQuestion } from "../services/questionBank.service"

interface SaveToBankDialogProps {
  open: boolean
  /** The question text to save into the bank. */
  questionText: string
  onClose: () => void
}

const NEW_CATEGORY = "__new__"

/**
 * Dialog to save a manually-written question into the shared question bank,
 * either in an existing category or in a brand-new one.
 */
export function SaveToBankDialog({ open, questionText, onClose }: SaveToBankDialogProps) {
  const categories = useQuestionBank()
  const [categoryId, setCategoryId] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [saving, setSaving] = useState(false)

  // Default to the first category whenever the dialog (re)opens.
  useEffect(() => {
    if (open) {
      setCategoryId(categories[0]?.id ?? NEW_CATEGORY)
      setNewCategory("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isNew = categoryId === NEW_CATEGORY
  const canSave =
    questionText.trim().length > 0 &&
    (isNew ? newCategory.trim().length > 0 : categoryId.length > 0) &&
    !saving

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      const targetId = isNew ? await addBankCategory(newCategory) : categoryId
      await addBankQuestion(targetId, questionText)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 700 }}>Enregistrer dans la banque</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          « {questionText.trim()} »
        </Typography>

        <TextField
          select
          fullWidth
          size="small"
          label="Catégorie"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          sx={{ mb: 2 }}
        >
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.label}
            </MenuItem>
          ))}
          <Divider />
          <MenuItem value={NEW_CATEGORY}>+ Nouvelle catégorie…</MenuItem>
        </TextField>

        {isNew && (
          <TextField
            fullWidth
            size="small"
            label="Nom de la catégorie"
            placeholder="Ex: Travail"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Stack direction="row" sx={{ gap: 1 }}>
          <Button onClick={onClose} sx={{ textTransform: "none" }}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!canSave}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Enregistrer
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}
