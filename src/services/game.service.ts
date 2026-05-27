import { ref, set, get, update, runTransaction } from "firebase/database"
import { db } from "../config/firebase"
import type { Game, GameState, JudgingSubPhase, Player, Question, Ranking } from "../types/types"

function requireDb() {
  if (!db) throw new Error("Firebase not configured. Edit src/config/firebase.ts.")
  return db
}

function gamePath(code: string) {
  return `games/${code}`
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createGame(
  code: string,
  name: string,
  master: Player,
  questions: Question[],
): Promise<void> {
  const database = requireDb()
  const game: Game = {
    code,
    name,
    masterId: master.id,
    players: [master],
    questions,
    state: { phase: "waiting", currentQuestionIndex: 0 },
    playerVotes: null,
    groundTruth: null,
    judgeRankings: null,
  }
  await set(ref(database, gamePath(code)), game)
}

// ── Join ──────────────────────────────────────────────────────────────────────

export async function joinGame(code: string, player: Player): Promise<Game> {
  const database = requireDb()
  const gameRef = ref(database, gamePath(code))

  const { committed, snapshot } = await runTransaction(gameRef, (current) => {
    if (!current) return current // game doesn't exist, abort
    if (current.state?.phase !== "waiting") return undefined // abort
    const players: Player[] = current.players ?? []
    if (players.find((p: Player) => p.id === player.id)) return current // already in
    if (players.find((p: Player) => p.name.toLowerCase() === player.name.toLowerCase())) return undefined // name taken
    return { ...current, players: [...players, player] }
  })

  if (!committed || !snapshot.exists()) {
    // Check if it failed due to duplicate name
    const checkSnap = await get(gameRef)
    if (checkSnap.exists()) {
      const game = checkSnap.val() as Game
      const players: Player[] = game.players ?? []
      if (players.find((p) => p.name.toLowerCase() === player.name.toLowerCase())) {
        throw new Error("Ce nom est déjà pris dans cette partie.")
      }
    }
    throw new Error(`Impossible de rejoindre la partie "${code}".`)
  }

  return snapshot.val() as Game
}

// ── State machine (master only) ───────────────────────────────────────────────

export async function updateGameState(
  code: string,
  state: Partial<GameState>,
): Promise<void> {
  const database = requireDb()
  await update(ref(database, `${gamePath(code)}/state`), state)
}

export async function advancePhase(
  code: string,
  phase: GameState["phase"],
): Promise<void> {
  return updateGameState(code, { phase })
}

export async function advanceQuestion(
  code: string,
  index: number,
): Promise<void> {
  return updateGameState(code, { currentQuestionIndex: index })
}

// ── Voting ────────────────────────────────────────────────────────────────────

/**
 * Submit a player's ranking for a given question.
 * Path: games/{code}/playerVotes/{questionId}/{voterId}
 */
export async function submitVote(
  code: string,
  questionId: string,
  voterId: string,
  ranking: Ranking,
): Promise<void> {
  const database = requireDb()
  await set(
    ref(database, `${gamePath(code)}/playerVotes/${questionId}/${voterId}`),
    ranking,
  )
}

// ── Ground truth (computed by master after voting) ────────────────────────────

export async function setGroundTruth(
  code: string,
  groundTruth: Record<string, Ranking>,
): Promise<void> {
  const database = requireDb()
  await set(ref(database, `${gamePath(code)}/groundTruth`), groundTruth)
}

// ── Judge rankings ────────────────────────────────────────────────────────────

export async function submitJudgeRanking(
  code: string,
  questionId: string,
  ranking: Ranking,
): Promise<void> {
  const database = requireDb()
  await set(
    ref(database, `${gamePath(code)}/judgeRankings/${questionId}`),
    ranking,
  )
}

// ── Judging sub-phase controls ────────────────────────────────────────────────

/** Update the live judge ranking (real-time sync for all judges) */
export async function updateLiveJudgeRanking(
  code: string,
  questionId: string,
  orderedPlayerIds: string[],
): Promise<void> {
  const database = requireDb()
  await set(
    ref(database, `${gamePath(code)}/liveJudgeOrder/${questionId}`),
    orderedPlayerIds,
  )
}

/** Set the judging sub-phase */
export async function setJudgingSubPhase(
  code: string,
  subPhase: JudgingSubPhase,
  attempt?: number,
): Promise<void> {
  const updates: Partial<GameState> = { judgingSubPhase: subPhase }
  if (attempt !== undefined) updates.judgingAttempt = attempt
  return updateGameState(code, updates)
}

/** Start judging phase for a question (reset sub-state) */
export async function startJudgingQuestion(
  code: string,
  questionIndex: number,
): Promise<void> {
  return updateGameState(code, {
    currentQuestionIndex: questionIndex,
    judgingSubPhase: "ranking",
    judgingAttempt: 1,
  })
}

/** Advance to next judging question or to results */
export async function nextJudgingQuestion(code: string): Promise<void> {
  const database = requireDb()
  const snapshot = await get(ref(database, gamePath(code)))
  if (!snapshot.exists()) return
  const game = snapshot.val() as Game
  const nextIndex = game.state.currentQuestionIndex + 1
  if (nextIndex < game.questions.length) {
    await startJudgingQuestion(code, nextIndex)
  } else {
    await update(ref(database, `${gamePath(code)}/state`), { phase: "results", judgingSubPhase: null, judgingAttempt: null })
  }
}
