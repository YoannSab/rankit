import { createContext, useCallback, useState, type ReactNode } from "react"
import { db } from "../config/firebase"
import { useRealtimeValue } from "../hooks/useRealtimeValue"
import type { Game, Player } from "../types/types"

const PLAYER_ID_KEY = "rankit_player_id"

export interface RankItContextValue {
    player: Player | null
    setPlayer: (value: Player | null) => void
    isOnline: boolean
    game: Game | null
    setGame: (value: Game) => void
    gameCode: string | null
    setGameCode: (value: string | null) => void
    isMaster: boolean
    restorePlayer: () => void
}


export const RankItContext = createContext<RankItContextValue | null>(null)

export function RankItProvider({ children }: { children: ReactNode }) {
    const [player, setPlayerState] = useState<Player | null>(null)
    const [gameCode, setGameCode] = useState<string | null>(null)
    const [game, setGame] = useRealtimeValue<Game>(gameCode ? `games/${gameCode}` : null)

    const isOnline = db !== null
    const isMaster = !!(player && game && game.masterId === player.id)

    const setPlayer = useCallback((value: Player | null) => {
        setPlayerState(value)
        if (value) {
            localStorage.setItem(PLAYER_ID_KEY, value.id)
        } else {
            localStorage.removeItem(PLAYER_ID_KEY)
        }
    }, [])

    // Try to restore player from localStorage + current game data
    const restorePlayer = useCallback(() => {
        if (player) return
        const storedId = localStorage.getItem(PLAYER_ID_KEY)
        if (!storedId || !game) return
        const found = game.players.find((p) => p.id === storedId)
        if (found) {
            setPlayerState(found)
        }
    }, [player, game])

    return (
        <RankItContext.Provider
            value={{ player, setPlayer, isOnline, game, setGame, gameCode, setGameCode, isMaster, restorePlayer }}
        >
            {children}
        </RankItContext.Provider>
    )
}
