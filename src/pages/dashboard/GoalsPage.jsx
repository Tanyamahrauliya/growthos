import { useState } from 'react'
import { useGoals } from '../../hooks/useGoals'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { StatusBadge } from '../../components/ui/Badge'

const CATEGORIES = ['general','health','career','learning','finance','relationships','creativity','mindfulness','fitness']
const STATUSES = ['active','paused','completed','archived']
const CAT_ICONS = { health:'❤️', career:'💼', learning:'📚', finance:'💰', relationships:'👥', creativity:'🎨', mindfulness:'🧘', fitness:'🏋️', general:'🎯' }

function GoalForm({ initial, onSubmit, submitting, error }) {
  const [form, setForm] = useState(initial ?? {
    title: '', description: '', category: 'general', status: 'active', target_date: '', progress: 0
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <form id="goal-form" onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      {error && <div className="auth-alert auth-alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="form-input" required placeholder="What do you want to achieve?" value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-input form-textarea" rows={2} placeholder="Why does this matter?" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label">Target date</label>
          <input type="date" className="form-input" value={form.target_date ?? ''} onChange={e => set('target_date', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Progress ({form.progress}%)</label>
          <input type="range" min={0} max={100} className="form-range" value={form.progress} onChange={e => set('progress', Number(e.target.value))} />
        </div>
      </div>
      <button type="submit" className="btn-primary" style={{ marginTop: 8 }} disabled={submitting}>
        {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Create Goal'}
      </button>
    </form>
  )
}

function MilestoneRow({ m, goalId, onToggle, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className={`milestone-row ${m.is_completed ? 'done' : ''}`}>
      <button className={`milestone-check ${m.is_completed ? 'checked' : ''}`} onClick={() => onToggle(m.id, goalId, !m.is_completed)}>
        {m.is_completed ? '✓' : ''}
      </button>
      <span className="milestone-title">{m.title}</span>
      {m.due_date && <span className="milestone-date">{m.due_date}</span>}
      <button className="milestone-del" onClick={async () => { setDeleting(true); await onDelete(m.id, goalId); setDeleting(false) }} disabled={deleting}>
        {deleting ? '…' : '✕'}
      </button>
    </div>
  )
}

function GoalCard({ goal, onEdit, onDelete, onAddMilestone, onToggleMilestone, onDeleteMilestone }) {
  const [expanded, setExpanded] = useState(false)
  const [addingMs, setAddingMs] = useState(false)
  const [msTitle, setMsTitle] = useState('')
  const [msDue, setMsDue] = useState('')
  const [saving, setSaving] = useState(false)

  const milestones = goal.milestones ?? []
  const completedMs = milestones.filter(m => m.is_completed).length
  const totalMs = milestones.length
  const icon = CAT_ICONS[goal.category] ?? '🎯'

  async function submitMilestone(e) {
    e.preventDefault()
    if (!msTitle.trim()) return
    setSaving(true)
    await onAddMilestone(goal.id, msTitle, msDue)
    setMsTitle(''); setMsDue(''); setAddingMs(false); setSaving(false)
  }

  return (
    <div className={`goal-card ${goal.status === 'completed' ? 'goal-card-done' : ''}`}>
      <div className="goal-card-header">
        <div className="goal-card-icon">{icon}</div>
        <div className="goal-card-info">
          <h3 className="goal-card-title">{goal.title}</h3>
          {goal.description && <p className="goal-card-desc">{goal.description}</p>}
        </div>
        <div className="goal-card-actions">
          <StatusBadge status={goal.status} />
          <button className="icon-btn" title="Edit" onClick={() => onEdit(goal)}>✏️</button>
          <button className="icon-btn" title="Delete" onClick={() => onDelete(goal)}>🗑️</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="goal-progress-wrap">
        <div className="goal-progress-bar">
          <div className="goal-progress-fill" style={{ width: `${goal.progress}%` }} />
        </div>
        <span className="goal-progress-label">{goal.progress}%</span>
      </div>

      <div className="goal-meta-row">
        {goal.target_date && <span className="goal-meta">📅 {goal.target_date}</span>}
        <span className="goal-meta">🏷️ {goal.category}</span>
        {totalMs > 0 && <span className="goal-meta">✅ {completedMs}/{totalMs} milestones</span>}
        <button className="btn-text" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▲ Hide milestones' : '▼ Milestones'}
        </button>
      </div>

      {expanded && (
        <div className="milestones-section">
          {milestones.length === 0 && (
            <p className="milestone-empty">No milestones yet.</p>
          )}
          {milestones.map(m => (
            <MilestoneRow key={m.id} m={m} goalId={goal.id}
              onToggle={onToggleMilestone} onDelete={onDeleteMilestone} />
          ))}
          {addingMs ? (
            <form className="milestone-add-form" onSubmit={submitMilestone}>
              <input className="form-input" placeholder="Milestone title" value={msTitle} onChange={e => setMsTitle(e.target.value)} autoFocus />
              <input type="date" className="form-input" value={msDue} onChange={e => setMsDue(e.target.value)} />
              <div style={{ display:'flex', gap:8 }}>
                <button type="submit" className="btn-primary" style={{ flex:1 }} disabled={saving}>{saving ? '…' : 'Add'}</button>
                <button type="button" className="btn-ghost" onClick={() => setAddingMs(false)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button className="btn-ghost btn-sm" onClick={() => setAddingMs(true)}>+ Add milestone</button>
          )}
        </div>
      )}
    </div>
  )
}

export default function GoalsPage() {
  const { goals, loading, createGoal, updateGoal, deleteGoal, createMilestone, toggleMilestone, deleteMilestone } = useGoals()
  const [showCreate, setShowCreate] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter)

  async function handleCreate(form) {
    setSubmitting(true); setFormError(null)
    const { error } = await createGoal({
      title: form.title, description: form.description, category: form.category,
      status: form.status, target_date: form.target_date || null, progress: form.progress
    })
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setShowCreate(false)
  }

  async function handleEdit(form) {
    setSubmitting(true); setFormError(null)
    const { error } = await updateGoal(editGoal.id, {
      title: form.title, description: form.description, category: form.category,
      status: form.status, target_date: form.target_date || null, progress: form.progress
    })
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setEditGoal(null)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteGoal(deleteTarget.id)
    setDeleting(false); setDeleteTarget(null)
  }

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Goals</h1>
          <p className="page-subtitle">Define and crush your most important objectives</p>
        </div>
        <button id="btn-create-goal" className="btn-primary" style={{ width:'auto', paddingInline:24 }} onClick={() => { setShowCreate(true); setFormError(null) }}>
          + New Goal
        </button>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs">
        {['all', 'active', 'paused', 'completed', 'archived'].map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${goals.length})` : `(${goals.filter(g => g.status === f).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="🎯" title="No goals yet" description="Set your first goal and start making progress."
          action={<button className="btn-primary" style={{ width:'auto', paddingInline:24 }} onClick={() => setShowCreate(true)}>+ Create Goal</button>} />
      ) : (
        <div className="goals-list">
          {filtered.map(goal => (
            <GoalCard key={goal.id} goal={goal}
              onEdit={g => { setEditGoal(g); setFormError(null) }}
              onDelete={g => setDeleteTarget(g)}
              onAddMilestone={createMilestone}
              onToggleMilestone={toggleMilestone}
              onDeleteMilestone={deleteMilestone} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Goal" size="lg">
        <GoalForm onSubmit={handleCreate} submitting={submitting} error={formError} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editGoal} onClose={() => setEditGoal(null)} title="Edit Goal" size="lg">
        {editGoal && (
          <GoalForm initial={{ ...editGoal, target_date: editGoal.target_date ?? '' }}
            onSubmit={handleEdit} submitting={submitting} error={formError} />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Goal" message={`Delete "${deleteTarget?.title}"? This will also remove all its milestones.`} />
    </div>
  )
}
