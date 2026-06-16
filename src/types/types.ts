export type Role = "player" | "judge"

export type GamePhase = "waiting" | "voting" | "judging" | "results"

export interface Player {
    id: string
    name: string
    role: Role
    /** Optional avatar as a compressed base64 data URL (taken from camera or gallery) */
    avatar?: string
}

export interface Question {
    id: string
    text: string
}

/**
 * Ranking for a single question: playerId → rank (1 = first)
 * Each player ranks all players for that question.
 */
export type Ranking = Record<Player["id"], number>

export interface Game {
    code: string
    name: string
    masterId: Player["id"]
    players: Player[]
    questions: Question[]
    state: GameState
    /** Per-question per-voter rankings: questionId → voterId → ranking */
    playerVotes: Record<Question["id"], Record<Player["id"], Ranking>> | null
    /** Ground truth: averaged player rankings (questionId → playerId → avg rank) */
    groundTruth: Record<Question["id"], Ranking> | null
    /** Judge consensus ranking (questionId → playerId → rank) */
    judgeRankings: Record<Question["id"], Ranking> | null
}

export type JudgingSubPhase = "ranking" | "revealed"

export interface GameState {
    phase: GamePhase
    currentQuestionIndex: number
    /** Sub-phase within judging: ranking (judges drag), revealed (show green/red results) */
    judgingSubPhase?: JudgingSubPhase
    /** How many attempts judges have made on the current question */
    judgingAttempt?: number
}