import { useMemo } from "react"
import { useRealtimeValue } from "./useRealtimeValue"
import {
  remoteBankToCategories,
  type QuestionCategory,
  type RemoteQuestionBank,
} from "../utils/questionBank"

/**
 * Subscribes to the shared question bank on Firebase and returns the sorted,
 * typed categories.
 */
export function useQuestionBank(): QuestionCategory[] {
  const [remote] = useRealtimeValue<RemoteQuestionBank>("questionBank")
  return useMemo(() => remoteBankToCategories(remote), [remote])
}
