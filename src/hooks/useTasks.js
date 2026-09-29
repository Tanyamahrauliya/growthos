import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setTasks(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function createTask(payload) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()
    if (!error && data) setTasks(prev => [data, ...prev])
    return { data, error }
  }

  async function updateTask(id, payload) {
    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && data) setTasks(prev => prev.map(t => t.id === id ? data : t))
    return { data, error }
  }

  async function deleteTask(id) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
    return { error }
  }

  async function toggleComplete(task) {
    const isDone = task.status === 'done'
    return updateTask(task.id, {
      status: isDone ? 'todo' : 'done',
      completed_at: isDone ? null : new Date().toISOString(),
    })
  }

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayTasks = tasks.filter(t => t.due_date === todayStr || (!t.due_date && t.status !== 'done'))
  const overdueTasks = tasks.filter(t => t.due_date && t.due_date < todayStr && t.status !== 'done')
  const doneTasks = tasks.filter(t => t.status === 'done')
  const pendingTasks = tasks.filter(t => t.status !== 'done')

  return {
    tasks,
    todayTasks,
    overdueTasks,
    doneTasks,
    pendingTasks,
    loading,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  }
}
