/** A single question stored in the bank. */
export interface BankQuestion {
  id: string
  text: string
}

/** A category of suggested questions, ready to render. */
export interface QuestionCategory {
  /** Stable key used internally (the Firebase key) */
  id: string
  /** Human-friendly label shown in the UI */
  label: string
  /** Suggested questions for this category */
  questions: BankQuestion[]
}

// ── Firebase shapes ───────────────────────────────────────────────────────────

export interface RemoteQuestion {
  text: string
  order?: number
}

export interface RemoteCategory {
  label: string
  order?: number
  questions?: Record<string, RemoteQuestion>
}

export type RemoteQuestionBank = Record<string, RemoteCategory>

// ── Conversion ────────────────────────────────────────────────────────────────

/**
 * Converts the raw Firebase bank into a sorted, typed list of categories
 * ready to render. Categories and questions are ordered by their `order`
 * field (ascending).
 */
export function remoteBankToCategories(
  remote: RemoteQuestionBank | null,
): QuestionCategory[] {
  if (!remote) return []
  return Object.entries(remote)
    .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
    .map(([id, cat]) => ({
      id,
      label: cat.label,
      questions: Object.entries(cat.questions ?? {})
        .sort(([, a], [, b]) => (a.order ?? 0) - (b.order ?? 0))
        .map(([qid, q]) => ({ id: qid, text: q.text })),
    }))
}
