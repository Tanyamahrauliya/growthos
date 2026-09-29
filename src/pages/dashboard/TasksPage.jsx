import { useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'
import { PriorityBadge, StatusBadge } from '../../components/ui/Badge'

const PRIORITIES = ['low','medium','high','urgent']
const STATUSES = ['todo','in_progress','done']
const PRIORITY_ICON = { low:'🟢', medium:'🟡', high:'🟠', urgent:'🔴' }

function TaskForm({ initial, onSubmit, submitting, error }) {
  const [form, setForm] = useState(initial ?? { title: '', description: '', priority: 'medium', status: 'todo', due_date: '' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  return (
    <form id="task-form" onSubmit={e => { e.preventDefault(); onSubmit(form) }}>
      {error && <div className="auth-alert auth-alert-error" style={{ marginBottom: 12 }}>⚠️ {error}</div>}
      <div className="form-group">
        <label className="form-label">Task title *</label>
        <input className="form-input" required placeholder="What needs to be done?" value={form.title} onChange={e => set('title', e.target.value)} />
      </div>
      <div className="form-group">
        <label className="form-label">Description (optional)</label>
        <textarea className="form-input form-textarea" rows={2} placeholder="Add any details…" value={form.description ?? ''} onChange={e => set('description', e.target.value)} />
      </div>
      <div className="form-row-2">
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-input" value={form.priority} onChange={e => set('priority', e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_ICON[p]} {p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-input" value={form.status} onChange={e => set('status', e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s === 'todo' ? 'To Do' : s === 'in_progress' ? 'In Progress' : 'Done'}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Due date (optional)</label>
        <input type="date" className="form-input" value={form.due_date ?? ''} onChange={e => set('due_date', e.target.value)} />
      </div>
      <button type="submit" className="btn-primary" style={{ marginTop: 8 }} disabled={submitting}>
        {submitting ? 'Saving…' : initial ? 'Save Changes' : 'Create Task'}
      </button>
    </form>
  )
}

function TaskRow({ task, onToggle, onEdit, onDelete }) {
  const [toggling, setToggling] = useState(false)
  const isDone = task.status === 'done'
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = task.due_date && task.due_date < today && !isDone

  async function handleToggle() {
    setToggling(true)
    await onToggle(task)
    setToggling(false)
  }

  return (
    <div className={`task-row ${isDone ? 'task-done' : ''} ${isOverdue ? 'task-overdue' : ''}`}>
      <button
        id={`task-toggle-${task.id}`}
        className={`task-check ${isDone ? 'checked' : ''}`}
        onClick={handleToggle}
        disabled={toggling}
        title={isDone ? 'Mark incomplete' : 'Mark complete'}
      >
        {toggling ? '…' : isDone ? '✓' : ''}
      </button>
      <div className="task-row-info">
        <p className={`task-title ${isDone ? 'line-through' : ''}`}>{task.title}</p>
        {task.description && <p className="task-desc">{task.description}</p>}
        <div className="task-meta-row">
          <PriorityBadge priority={task.priority} />
          <StatusBadge status={task.status} />
          {task.due_date && (
            <span className={`task-due ${isOverdue ? 'overdue' : ''}`}>
              📅 {isOverdue ? '⚠️ Overdue · ' : ''}{task.due_date}
            </span>
          )}
        </div>
      </div>
      <div className="task-row-actions">
        <button className="icon-btn" title="Edit" onClick={() => onEdit(task)}>✏️</button>
        <button className="icon-btn" title="Delete" onClick={() => onDelete(task)}>🗑️</button>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const { tasks, overdueTasks, doneTasks, pendingTasks, loading,
          createTask, updateTask, deleteTask, toggleComplete } = useTasks()
  const [showCreate, setShowCreate] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? tasks
    : filter === 'pending' ? pendingTasks
    : filter === 'overdue' ? overdueTasks
    : doneTasks

  async function handleCreate(form) {
    setSubmitting(true); setFormError(null)
    const { error } = await createTask({
      title: form.title, description: form.description,
      priority: form.priority, status: form.status, due_date: form.due_date || null
    })
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setShowCreate(false)
  }

  async function handleEdit(form) {
    setSubmitting(true); setFormError(null)
    const { error } = await updateTask(editTask.id, {
      title: form.title, description: form.description,
      priority: form.priority, status: form.status, due_date: form.due_date || null
    })
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setEditTask(null)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteTask(deleteTarget.id)
    setDeleting(false); setDeleteTarget(null)
  }

  const doneCount = doneTasks.length
  const totalCount = tasks.length
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">✅ Tasks</h1>
          <p className="page-subtitle">Stay on top of what matters most</p>
        </div>
        <button id="btn-create-task" className="btn-primary" style={{ width:'auto', paddingInline:24 }} onClick={() => { setShowCreate(true); setFormError(null) }}>
          + New Task
        </button>
      </div>

      {/* Summary strip */}
      {totalCount > 0 && (
        <div className="tasks-summary">
          <div className="tasks-summary-stat"><span className="ts-num">{pendingTasks.length}</span><span className="ts-lbl">Pending</span></div>
          <div className="tasks-summary-divider" />
          <div className="tasks-summary-stat"><span className="ts-num overdue-text">{overdueTasks.length}</span><span className="ts-lbl">Overdue</span></div>
          <div className="tasks-summary-divider" />
          <div className="tasks-summary-stat"><span className="ts-num done-text">{doneCount}</span><span className="ts-lbl">Done</span></div>
          <div className="tasks-summary-divider" />
          <div className="tasks-summary-progress">
            <span className="ts-lbl">Overall {completionPct}%</span>
            <div className="tasks-progress-bar"><div className="tasks-progress-fill" style={{ width:`${completionPct}%` }} /></div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="filter-tabs">
        {[
          { key:'all', label:`All (${tasks.length})` },
          { key:'pending', label:`Pending (${pendingTasks.length})` },
          { key:'overdue', label:`⚠️ Overdue (${overdueTasks.length})` },
          { key:'done', label:`Done (${doneTasks.length})` },
        ].map(({ key, label }) => (
          <button key={key} className={`filter-tab ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="✅" title={filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
          description={filter === 'all' ? 'Create your first task to get started.' : ''}
          action={filter === 'all' && <button className="btn-primary" style={{ width:'auto', paddingInline:24 }} onClick={() => setShowCreate(true)}>+ Create Task</button>} />
      ) : (
        <div className="tasks-list">
          {filtered.map(task => (
            <TaskRow key={task.id} task={task}
              onToggle={toggleComplete}
              onEdit={t => { setEditTask(t); setFormError(null) }}
              onDelete={t => setDeleteTarget(t)} />
          ))}
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Task" size="md">
        <TaskForm onSubmit={handleCreate} submitting={submitting} error={formError} />
      </Modal>

      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="md">
        {editTask && <TaskForm initial={{ ...editTask, due_date: editTask.due_date ?? '' }} onSubmit={handleEdit} submitting={submitting} error={formError} />}
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Task" message={`Delete "${deleteTarget?.title}"?`} />
    </div>
  )
}
