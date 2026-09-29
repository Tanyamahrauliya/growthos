import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useJournal() {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error) setEntries(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  async function createEntry(payload) {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        title: payload.title || null,
        content: payload.content,
        mood: payload.mood || null,
        mood_label: payload.mood_label || null,
        tags: payload.tags || [],
        prompts: payload.prompts || {},
        is_private: true,
      })
      .select()
      .single()
    if (!error && data) setEntries(prev => [data, ...prev])
    return { data, error }
  }

  async function updateEntry(id, payload) {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        title: payload.title || null,
        content: payload.content,
        mood: payload.mood || null,
        mood_label: payload.mood_label || null,
        tags: payload.tags || [],
        prompts: payload.prompts || {},
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error && data) setEntries(prev => prev.map(e => e.id === id ? data : e))
    return { data, error }
  }

  async function deleteEntry(id) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
    return { error }
  }

  // Check if user wrote today
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayEntry = entries.find(e => e.created_at?.slice(0, 10) === todayStr)

  return {
    entries,
    todayEntry,
    loading,
    refetch: fetchEntries,
    createEntry,
    updateEntry,
    deleteEntry,
  }
}
