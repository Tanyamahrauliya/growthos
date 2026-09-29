import { useState } from 'react'
import { useHabits } from '../../hooks/useHabits'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'

const HABIT_ICONS = ['💪', '📚', '🧘', '🏃', '💧', '🥗', '✍️', '🎯', '💤', '🙏', '🎨', '💻', '🎵', '🌅', '🛁', '🏋️']
const COLORS = ['#7c5cfc', '#0fb8d4', '#f97316', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6', '#06b6d4']

function HabitForm({ initial, onSubmit, submitting, error }) {
  const [form, setForm] = useState(initial ?? { name: '', description: '', icon: '💪', color: '#7c5cfc', frequency: 'daily' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <form id="habit-form" onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      {error && <div className="auth-alert auth-alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
      <div className="form-group">
        <label className="form-label">Habit name *</label>
        <input className="form-input" required placeholder="e.g. Morning run" value={form.name} onChange={e => set('name', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Description (optional)</label>
        <input className="form-input" placeholder="Briefly describe this habit" value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Icon</label>
        <div className="icon-grid">
          {HABIT_ICONS.map(icon => (
            <button key={icon} type="button" className={`icon-chip ${form.icon === icon ? 'active' : ''}`} onClick={() => set('icon', icon)}>{icon}</button>
          ))}
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Color</label>
        <div className="color-grid">
          {COLORS.map(color => (
            <button key={color} type="button"
              className={`color-chip ${form.color === color ? 'active' : ''}`}
              style={{ background: color }}
              onClick={() => set('color', color)} />
          ))}
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="habit-freq" className="form-label">Frequency</label>
        <select id="habit-freq" className="form-input" value={form.frequency} onChange={e => set('frequency', e.target.value)}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>
      <button type="submit" className="btn-primary" style={{ marginTop: 8 }} disabled={submitting}>
        {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Create Habit'}
      </button>
    </form>
  )
}

function HabitCard({ habit, isDone, onToggle, onEdit, onDelete }) {
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    await onToggle(habit.id)
    setToggling(false)
  }

  return (
    <div className={`habit-card ${isDone ? 'habit-done' : ''}`} style={{ '--habit-color': habit.color }}>
      <div className="habit-card-left">
        <button
          id={`habit-toggle-${habit.id}`}
          className={`habit-check-btn ${isDone ? 'checked' : ''}`}
          onClick={handleToggle}
          disabled={toggling}
          title={isDone ? 'Mark incomplete' : 'Mark complete'}
        >
          {toggling ? '…' : isDone ? '✓' : ''}
        </button>
        <div className="habit-icon-wrap" style={{ background: habit.color + '22' }}>
          <span className="habit-icon">{habit.icon}</span>
        </div>
        <div>
          <p className="habit-name">{habit.name}</p>
          {habit.description && <p className="habit-desc">{habit.description}</p>}
          <p className="habit-freq">{habit.frequency}</p>
        </div>
      </div>
      <div className="habit-card-right">
        <div className={`habit-status-pill ${isDone ? 'done' : 'pending'}`}>
          {isDone ? '✓ Done' : 'Pending'}
        </div>
        <button className="icon-btn" title="Edit" onClick={() => onEdit(habit)}>✏️</button>
        <button className="icon-btn" title="Delete" onClick={() => onDelete(habit)}>🗑️</button>
      </div>
    </div>
  )
}

export default function HabitsPage() {
  const { habits, loading, isLoggedToday, todayProgress, completedToday, totalHabits,
          createHabit, updateHabit, deleteHabit, toggleToday } = useHabits()
  const [showCreate, setShowCreate] = useState(false)
  const [editHabit, setEditHabit] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState(null)

  async function handleCreate(form) {
    setSubmitting(true); setFormError(null)
    const { error } = await createHabit({ name: form.name, description: form.description, icon: form.icon, color: form.color, frequency: form.frequency })
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setShowCreate(false)
  }

  async function handleEdit(form) {
    setSubmitting(true); setFormError(null)
    const { error } = await updateHabit(editHabit.id, { name: form.name, description: form.description, icon: form.icon, color: form.color, frequency: form.frequency })
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setEditHabit(null)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteHabit(deleteTarget.id)
    setDeleting(false); setDeleteTarget(null)
  }

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">🔁 Habits</h1>
          <p className="page-subtitle">Build consistency — one day at a time</p>
        </div>
        <button id="btn-create-habit" className="btn-primary" style={{ width:'auto', paddingInline:24 }} onClick={() => { setShowCreate(true); setFormError(null) }}>
          + New Habit
        </button>
      </div>

      {/* Today's progress summary */}
      {totalHabits > 0 && (
        <div className="habits-summary-card">
          <div className="habits-summary-info">
            <p className="habits-summary-label">Today&apos;s progress</p>
            <p className="habits-summary-count">{completedToday} / {totalHabits} habits completed</p>
          </div>
          <div className="habits-summary-ring-wrap">
            <div className="habits-summary-bar">
              <div className="habits-summary-fill" style={{ width: `${todayProgress}%` }} />
            </div>
            <span className="habits-summary-pct">{todayProgress}%</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="loading-spinner" /></div>
      ) : habits.length === 0 ? (
        <EmptyState icon="🔁" title="No habits yet" description="Add your first habit and start building streaks."
          action={<button className="btn-primary" style={{ width:'auto', paddingInline:24 }} onClick={() => setShowCreate(true)}>+ Create Habit</button>} />
      ) : (
        <div className="habits-list">
          {habits.map(habit => (
            <HabitCard key={habit.id} habit={habit}
              isDone={isLoggedToday(habit.id)}
              onToggle={toggleToday}
              onEdit={h => { setEditHabit(h); setFormError(null) }}
              onDelete={h => setDeleteTarget(h)} />
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Habit" size="md">
        <HabitForm onSubmit={handleCreate} submitting={submitting} error={formError} />
      </Modal>

      <Modal isOpen={!!editHabit} onClose={() => setEditHabit(null)} title="Edit Habit" size="md">
        {editHabit && <HabitForm initial={editHabit} onSubmit={handleEdit} submitting={submitting} error={formError} />}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Habit" message={`Delete "${deleteTarget?.name}"? All logs will be removed too.`} />
    </div>
  )
}
