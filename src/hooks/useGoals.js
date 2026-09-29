import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGoals = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('goals')
      .select('*, milestones(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setGoals(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  async function createGoal(payload) {
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...payload, user_id: user.id })
      .select('*, milestones(*)')
      .single()
    if (!error && data) setGoals(prev => [data, ...prev])
    return { data, error }
  }

  async function updateGoal(id, payload) {
    const { data, error } = await supabase
      .from('goals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*, milestones(*)')
      .single()
    if (!error && data) setGoals(prev => prev.map(g => g.id === id ? data : g))
    return { data, error }
  }

  async function deleteGoal(id) {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) setGoals(prev => prev.filter(g => g.id !== id))
    return { error }
  }

  // Milestones
  async function createMilestone(goalId, title, dueDate) {
    const { data, error } = await supabase
      .from('milestones')
      .insert({ goal_id: goalId, title, due_date: dueDate || null, user_id: user.id })
      .select()
      .single()
    if (!error && data) {
      setGoals(prev => prev.map(g =>
        g.id === goalId ? { ...g, milestones: [...(g.milestones ?? []), data] } : g
      ))
    }
    return { data, error }
  }

  async function toggleMilestone(milestoneId, goalId, isCompleted) {
    const { data, error } = await supabase
      .from('milestones')
      .update({ is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null })
      .eq('id', milestoneId)
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && data) {
      setGoals(prev => prev.map(g =>
        g.id === goalId
          ? { ...g, milestones: g.milestones.map(m => m.id === milestoneId ? data : m) }
          : g
      ))
    }
    return { data, error }
  }

  async function deleteMilestone(milestoneId, goalId) {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('user_id', user.id)
    if (!error) {
      setGoals(prev => prev.map(g =>
        g.id === goalId
          ? { ...g, milestones: g.milestones.filter(m => m.id !== milestoneId) }
          : g
      ))
    }
    return { error }
  }

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    createMilestone,
    toggleMilestone,
    deleteMilestone,
  }
}
