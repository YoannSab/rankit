import { useContext } from "react"
import { RankItContext, type RankItContextValue } from "../context/RankItContext"

export function useRankIt(): RankItContextValue {
  const ctx = useContext(RankItContext)
  if (!ctx) throw new Error("useRankIt must be used inside RankItProvider")
  return ctx
}
