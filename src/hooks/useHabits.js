import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

// Calculate streak from a sorted array of date strings (desc)
function calcStreak(dates) {
  if (!dates || dates.length === 0) return 0
  const dateSet = new Set(dates)
  let streak = 0
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  // Allow today OR yesterday as start of streak
  for (let i = 0; i < 365; i++) {
    const ds = cursor.toISOString().slice(0, 10)
    if (dateSet.has(ds)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else if (i === 0) {
      // Today not logged — try from yesterday
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function useHabits() {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [todayLogs, setTodayLogs] = useState([])   // habit_ids logged today
  const [streaks, setStreaks] = useState({})         // { habitId: number }
  const [loading, setLoading] = useState(true)

  const fetchHabits = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const today = todayStr()

    // Fetch habits + recent 90 days of logs for streak calculation
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const since = ninetyDaysAgo.toISOString().slice(0, 10)

    const [habitsRes, todayLogsRes, allLogsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('logged_at', today),
      supabase
        .from('habit_logs')
        .select('habit_id, logged_at')
        .eq('user_id', user.id)
        .gte('logged_at', since)
        .order('logged_at', { ascending: false }),
    ])

    const habitsList = habitsRes.data ?? []
    const todayLogIds = (todayLogsRes.data ?? []).map(l => l.habit_id)
    const allLogs = allLogsRes.data ?? []

    // Group logs by habit_id for streak calc
    const logsByHabit = {}
    for (const log of allLogs) {
      if (!logsByHabit[log.habit_id]) logsByHabit[log.habit_id] = []
      logsByHabit[log.habit_id].push(log.logged_at)
    }

    // Batch compute streaks
    const streakMap = {}
    for (const habit of habitsList) {
      streakMap[habit.id] = calcStreak(logsByHabit[habit.id] ?? [])
    }

    setHabits(habitsList)
    setTodayLogs(todayLogIds)
    setStreaks(streakMap)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchHabits() }, [fetchHabits])

  async function createHabit(payload) {
    const { data, error } = await supabase
      .from('habits')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()
    if (!error && data) {
      setHabits(prev => [data, ...prev])
      setStreaks(prev => ({ ...prev, [data.id]: 0 }))
    }
    return { data, error }
  }

  async function updateHabit(id, payload) {
    const { data, error } = await supabase
      .from('habits')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && data) setHabits(prev => prev.map(h => h.id === id ? data : h))
    return { data, error }
  }

  async function deleteHabit(id) {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) {
      setHabits(prev => prev.filter(h => h.id !== id))
      setTodayLogs(prev => prev.filter(hid => hid !== id))
      setStreaks(prev => { const n = { ...prev }; delete n[id]; return n })
    }
    return { error }
  }

  async function toggleToday(habitId) {
    const today = todayStr()
    const isDone = todayLogs.includes(habitId)

    if (isDone) {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('logged_at', today)
      if (!error) {
        setTodayLogs(prev => prev.filter(id => id !== habitId))
        // Recompute streak for this habit
        setStreaks(prev => ({ ...prev, [habitId]: Math.max(0, (prev[habitId] ?? 1) - 1) }))
      }
      return { error }
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .insert({ habit_id: habitId, user_id: user.id, logged_at: today })
      if (!error) {
        setTodayLogs(prev => [...prev, habitId])
        // Optimistically increment streak
        setStreaks(prev => ({ ...prev, [habitId]: (prev[habitId] ?? 0) + 1 }))
      }
      return { error }
    }
  }

  const completedToday = todayLogs.length
  const totalHabits = habits.length
  const todayProgress = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0
  const longestStreak = Object.values(streaks).length > 0 ? Math.max(...Object.values(streaks)) : 0
  const totalStreak = Object.values(streaks).reduce((s, v) => s + v, 0)

  return {
    habits,
    todayLogs,
    streaks,
    loading,
    completedToday,
    totalHabits,
    todayProgress,
    longestStreak,
    refetch: fetchHabits,
    isLoggedToday: (id) => todayLogs.includes(id),
    getStreak: (id) => streaks[id] ?? 0,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleToday,
  }
}
