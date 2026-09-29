import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useFocusSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*, goals(title), tasks(title)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(100)
    if (!error) setSessions(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  async function saveSession({ durationMin, label, goalId, taskId, notes, startedAt }) {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        duration_min: durationMin,
        label: label || null,
        goal_id: goalId || null,
        task_id: taskId || null,
        notes: notes || null,
        started_at: startedAt || new Date().toISOString(),
      })
      .select('*, goals(title), tasks(title)')
      .single()
    if (!error && data) setSessions(prev => [data, ...prev])
    return { data, error }
  }

  async function deleteSession(id) {
    const { error } = await supabase
      .from('focus_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) setSessions(prev => prev.filter(s => s.id !== id))
    return { error }
  }

  // Computed stats
  const todayStr = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions.filter(s => s.started_at?.slice(0, 10) === todayStr)
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_min ?? 0), 0)
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_min ?? 0), 0)
  const weekSessions = sessions.filter(s => {
    const d = new Date(s.started_at)
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  })
  const weekMinutes = weekSessions.reduce((sum, s) => sum + (s.duration_min ?? 0), 0)

  return {
    sessions,
    todaySessions,
    todayMinutes,
    totalMinutes,
    weekMinutes,
    loading,
    refetch: fetchSessions,
    saveSession,
    deleteSession,
  }
}
