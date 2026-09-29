import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useGoals } from './useGoals'
import { useHabits } from './useHabits'
import { useTasks } from './useTasks'
import { useFocusSessions } from './useFocusSessions'
import { useJournal } from './useJournal'

// ── Helper: POST to the Express AI Coach API ───────────────────────────────
async function coachPost(endpoint, body) {
  let res
  try {
    res = await fetch(`/api/coach/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (networkErr) {
    // fetch itself threw — server is unreachable (ECONNREFUSED / offline)
    throw new Error(
      'Cannot reach the AI Coach server. Make sure it is running:\n  npm run dev:server'
    )
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Server returned a non-JSON response (status ${res.status}).`)
  }

  if (!res.ok) {
    throw new Error(data?.error || `Server error (${res.status})`)
  }

  if (!data.result) {
    throw new Error('Server returned an empty result.')
  }

  return data.result
}

// ── Collect user context snapshot ──────────────────────────────────────────
function buildContextData({ profile, goals, habits, streaks, tasks, sessions, entries }) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return {
    profile,
    goals: goals.filter(g => g.status === 'active'),
    habits: habits.map(h => ({ name: h.name, streak: streaks[h.id] ?? 0 })),
    tasks: tasks
      .filter(t => new Date(t.created_at) > oneWeekAgo)
      .map(t => ({ title: t.title, status: t.status, priority: t.priority })),
    focusSessions: sessions.slice(0, 10).map(s => ({ duration: s.duration_min, label: s.label })),
    journalEntries: entries.slice(0, 5).map(e => ({ date: e.created_at, mood: e.mood_label, content: e.content })),
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────
export function useCoach() {
  const { profile } = useAuth()
  const { goals } = useGoals()
  const { habits, streaks } = useHabits()
  const { tasks } = useTasks()
  const { sessions } = useFocusSessions()
  const { entries } = useJournal()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getContextData = useCallback(
    () => buildContextData({ profile, goals, habits, streaks, tasks, sessions, entries }),
    [profile, goals, habits, streaks, tasks, sessions, entries]
  )

  const analyzeWeek = async () => {
    setLoading(true)
    setError(null)
    try {
      return await coachPost('analyze', { userData: getContextData() })
    } catch (err) {
      console.error('[GrowthOS Coach] analyzeWeek:', err.message)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async () => {
    setLoading(true)
    setError(null)
    try {
      return await coachPost('plan', { userData: getContextData() })
    } catch (err) {
      console.error('[GrowthOS Coach] createPlan:', err.message)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  const sendChatMessage = async (message, history) => {
    setLoading(true)
    setError(null)
    try {
      return await coachPost('chat', { userData: getContextData(), message, history })
    } catch (err) {
      console.error('[GrowthOS Coach] sendChatMessage:', err.message)
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { analyzeWeek, createPlan, sendChatMessage, loading, error }
}
