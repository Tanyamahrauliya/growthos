import { useState, useMemo } from 'react'
import { useJournal } from '../../hooks/useJournal'
import Modal from '../../components/ui/Modal'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import EmptyState from '../../components/ui/EmptyState'

const PROMPTS = [
  { key: 'accomplished', icon: '🏆', label: 'What did I accomplish today?' },
  { key: 'learned',      icon: '💡', label: 'What did I learn?' },
  { key: 'difficult',    icon: '😤', label: 'What was difficult?' },
  { key: 'improve',      icon: '🚀', label: 'What will I improve tomorrow?' },
]

const MOODS = [
  { value: 1, label: '😞', name: 'Very Low' },
  { value: 2, label: '😕', name: 'Low' },
  { value: 3, label: '😐', name: 'Neutral' },
  { value: 4, label: '🙂', name: 'Good' },
  { value: 5, label: '😊', name: 'Great' },
  { value: 6, label: '😄', name: 'Happy' },
  { value: 7, label: '😁', name: 'Very Happy' },
  { value: 8, label: '🤩', name: 'Awesome' },
  { value: 9, label: '🚀', name: 'Incredible' },
  { value: 10, label: '✨', name: 'Perfect' },
]

function moodEmoji(val) {
  return MOODS.find(m => m.value === val)?.label ?? '😐'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
}

function buildContent(prompts) {
  return PROMPTS
    .filter(p => prompts[p.key]?.trim())
    .map(p => `${p.icon} **${p.label}**\n${prompts[p.key]}`)
    .join('\n\n')
}

// ── Entry Editor (create / edit) ───────────────────────────────
function EntryEditor({ initial, onSubmit, submitting, error, onCancel }) {
  const isEdit = !!initial
  const initPrompts = initial?.prompts || {}
  const [mode, setMode] = useState(initial?.content && !Object.keys(initPrompts).length ? 'free' : 'guided')
  const [title, setTitle] = useState(initial?.title || '')
  const [freeContent, setFreeContent] = useState(
    mode === 'free' ? (initial?.content || '') : ''
  )
  const [prompts, setPrompts] = useState({
    accomplished: initPrompts.accomplished || '',
    learned: initPrompts.learned || '',
    difficult: initPrompts.difficult || '',
    improve: initPrompts.improve || '',
  })
  const [mood, setMood] = useState(initial?.mood || null)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(initial?.tags || [])

  function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const t = tagInput.trim().toLowerCase()
      if (t && !tags.includes(t)) setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  function removeTag(tag) { setTags(prev => prev.filter(t => t !== tag)) }

  function handleSubmit(e) {
    e.preventDefault()
    const content = mode === 'guided' ? buildContent(prompts) : freeContent
    if (!content.trim()) return
    onSubmit({
      title: title.trim() || null,
      content,
      mood,
      mood_label: mood ? MOODS.find(m => m.value === mood)?.name : null,
      tags,
      prompts: mode === 'guided' ? prompts : {},
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && <div className="auth-alert auth-alert-error">⚠️ {error}</div>}

      <div className="form-group">
        <label className="form-label">Title (optional)</label>
        <input className="form-input" placeholder="Give this entry a title…"
          value={title} onChange={e => setTitle(e.target.value)} />
      </div>

      {/* Mode toggle */}
      <div className="journal-mode-tabs">
        <button type="button" className={`journal-mode-tab ${mode === 'guided' ? 'active' : ''}`}
          onClick={() => setMode('guided')}>🧭 Guided</button>
        <button type="button" className={`journal-mode-tab ${mode === 'free' ? 'active' : ''}`}
          onClick={() => setMode('free')}>✏️ Free write</button>
      </div>

      {mode === 'guided' ? (
        <div className="journal-prompts">
          {PROMPTS.map(p => (
            <div key={p.key} className="form-group">
              <label className="form-label">{p.icon} {p.label}</label>
              <textarea className="form-input form-textarea" rows={3}
                placeholder="Write your thoughts here…"
                value={prompts[p.key]}
                onChange={e => setPrompts(prev => ({ ...prev, [p.key]: e.target.value }))} />
            </div>
          ))}
        </div>
      ) : (
        <div className="form-group">
          <label className="form-label">Your entry *</label>
          <textarea className="form-input form-textarea journal-free-textarea" rows={10}
            placeholder="What's on your mind today?"
            required
            value={freeContent}
            onChange={e => setFreeContent(e.target.value)} />
        </div>
      )}

      {/* Mood */}
      <div className="form-group">
        <label className="form-label">How are you feeling? {mood && `(${MOODS.find(m => m.value === mood)?.name})`}</label>
        <div className="mood-grid">
          {MOODS.map(m => (
            <button key={m.value} type="button"
              className={`mood-btn ${mood === m.value ? 'active' : ''}`}
              title={m.name}
              onClick={() => setMood(prev => prev === m.value ? null : m.value)}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="form-group">
        <label className="form-label">Tags (press Enter to add)</label>
        <div className="tag-input-wrap">
          {tags.map(t => (
            <span key={t} className="tag-chip">
              #{t}
              <button type="button" className="tag-remove" onClick={() => removeTag(t)}>×</button>
            </span>
          ))}
          <input className="tag-input" placeholder="Add tag…"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={addTag} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Entry'}
        </button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

// ── Entry Card ────────────────────────────────────────────────
function EntryCard({ entry, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const hasPrompts = entry.prompts && Object.values(entry.prompts).some(v => v?.trim())
  const preview = entry.content?.slice(0, 160) + (entry.content?.length > 160 ? '…' : '')

  return (
    <div className="journal-entry-card">
      <div className="journal-entry-header">
        <div className="journal-entry-meta">
          {entry.mood && (
            <span className="journal-mood-badge" title={entry.mood_label}>
              {moodEmoji(entry.mood)}
            </span>
          )}
          <div>
            {entry.title && <p className="journal-entry-title">{entry.title}</p>}
            <p className="journal-entry-date">{formatDate(entry.created_at)}</p>
          </div>
        </div>
        <div className="journal-entry-actions">
          {entry.tags?.length > 0 && (
            <div className="journal-tags-row">
              {entry.tags.map(t => <span key={t} className="tag-chip small">#{t}</span>)}
            </div>
          )}
          <button className="icon-btn" onClick={() => onEdit(entry)} title="Edit">✏️</button>
          <button className="icon-btn" onClick={() => onDelete(entry)} title="Delete">🗑️</button>
        </div>
      </div>

      <div className="journal-entry-content">
        {!expanded ? (
          <p className="journal-entry-preview">{preview}</p>
        ) : hasPrompts ? (
          <div className="journal-prompts-view">
            {PROMPTS.filter(p => entry.prompts[p.key]?.trim()).map(p => (
              <div key={p.key} className="journal-prompt-block">
                <p className="journal-prompt-label">{p.icon} {p.label}</p>
                <p className="journal-prompt-answer">{entry.prompts[p.key]}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="journal-entry-full">{entry.content}</p>
        )}
      </div>

      <button className="btn-text" style={{ marginTop: 8 }} onClick={() => setExpanded(e => !e)}>
        {expanded ? '▲ Show less' : '▼ Read more'}
      </button>
    </div>
  )
}

// ── Journal Page ──────────────────────────────────────────────
export default function JournalPage() {
  const { entries, todayEntry, loading, createEntry, updateEntry, deleteEntry } = useJournal()
  const [showCreate, setShowCreate] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(e =>
      e.content?.toLowerCase().includes(q) ||
      e.title?.toLowerCase().includes(q) ||
      e.tags?.some(t => t.includes(q))
    )
  }, [entries, search])

  async function handleCreate(payload) {
    setSubmitting(true); setFormError(null)
    const { error } = await createEntry(payload)
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setShowCreate(false)
  }

  async function handleEdit(payload) {
    setSubmitting(true); setFormError(null)
    const { error } = await updateEntry(editEntry.id, payload)
    setSubmitting(false)
    if (error) { setFormError(error.message); return }
    setEditEntry(null)
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteEntry(deleteTarget.id)
    setDeleting(false); setDeleteTarget(null)
  }

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">📓 Journal</h1>
          <p className="page-subtitle">Reflect, process, and grow through daily writing</p>
        </div>
        <button id="btn-new-entry" className="btn-primary" style={{ width: 'auto', paddingInline: 24 }}
          onClick={() => { setShowCreate(true); setFormError(null) }}>
          + New Entry
        </button>
      </div>

      {/* Today's nudge */}
      {!loading && !todayEntry && (
        <div className="journal-today-nudge">
          <span className="journal-nudge-icon">📝</span>
          <div>
            <p className="journal-nudge-title">Write today&apos;s entry</p>
            <p className="journal-nudge-sub">Take 5 minutes to reflect on your day.</p>
          </div>
          <button className="btn-primary" style={{ width: 'auto', paddingInline: 20, flexShrink: 0 }}
            onClick={() => { setShowCreate(true); setFormError(null) }}>
            Write now →
          </button>
        </div>
      )}

      {todayEntry && (
        <div className="journal-today-done">
          ✅ You wrote today&apos;s entry · {moodEmoji(todayEntry.mood)} Mood: {todayEntry.mood_label || todayEntry.mood || '—'}
        </div>
      )}

      {/* Search */}
      {entries.length > 0 && (
        <div className="journal-search-wrap">
          <input className="form-input journal-search" placeholder="🔍 Search entries by title, content, or tag…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      )}

      {/* Entry list */}
      {loading ? (
        <div className="loading-screen" style={{ minHeight: 200 }}><div className="loading-spinner" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon="📓" title={search ? 'No matching entries' : 'Start your journal'}
          description={search ? 'Try a different search term.' : 'Write your first entry and begin your reflection journey.'}
          action={!search && (
            <button className="btn-primary" style={{ width: 'auto', paddingInline: 24 }}
              onClick={() => setShowCreate(true)}>
              + Write first entry
            </button>
          )} />
      ) : (
        <div className="journal-entries-list">
          {filtered.map(entry => (
            <EntryCard key={entry.id} entry={entry}
              onEdit={e => { setEditEntry(e); setFormError(null) }}
              onDelete={e => setDeleteTarget(e)} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Journal Entry" size="lg">
        <EntryEditor onSubmit={handleCreate} submitting={submitting} error={formError}
          onCancel={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editEntry} onClose={() => setEditEntry(null)} title="Edit Entry" size="lg">
        {editEntry && (
          <EntryEditor initial={editEntry} onSubmit={handleEdit} submitting={submitting}
            error={formError} onCancel={() => setEditEntry(null)} />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Entry" message={`Delete this journal entry? This cannot be undone.`} />
    </div>
  )
}
