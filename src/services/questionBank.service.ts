import { ref, push, remove, set } from "firebase/database"
import { db } from "../config/firebase"

const BANK_PATH = "questionBank"

function requireDb() {
  if (!db) throw new Error("Firebase not configured. Edit src/config/firebase.ts.")
  return db
}

// ── Category ──────────────────────────────────────────────────────────────────

/** Create a new category and return its generated id. */
export async function addBankCategory(label: string): Promise<string> {
  const database = requireDb()
  const catRef = push(ref(database, BANK_PATH))
  await set(catRef, { label: label.trim(), order: Date.now() })
  return catRef.key as string
}

// ── Question CRUD ─────────────────────────────────────────────────────────────

export async function addBankQuestion(
  categoryId: string,
  text: string,
): Promise<void> {
  const database = requireDb()
  const qRef = push(ref(database, `${BANK_PATH}/${categoryId}/questions`))
  await set(qRef, { text: text.trim(), order: Date.now() })
}

export async function deleteBankQuestion(
  categoryId: string,
  questionId: string,
): Promise<void> {
  const database = requireDb()
  await remove(ref(database, `${BANK_PATH}/${categoryId}/questions/${questionId}`))
}
