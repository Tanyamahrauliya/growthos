import { useState, useEffect, useRef, useCallback } from 'react'
import { useFocusSessions } from '../../hooks/useFocusSessions'
import { useGoals } from '../../hooks/useGoals'
import { useTasks } from '../../hooks/useTasks'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

// ── Preset durations ──────────────────────────────────────────
const PRESETS = [
  { label: '15 min', value: 15 },
  { label: '25 min', value: 25 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '60 min', value: 60 },
  { label: '90 min', value: 90 },
]

// ── Format seconds as MM:SS ───────────────────────────────────
function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── Circular SVG progress ring ────────────────────────────────
function TimerRing({ pct, size = 240, stroke = 10, children }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className="timer-ring-wrap" style={{ width: size, maxWidth: '100%', aspectRatio: '1 / 1' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" className="timer-ring-svg">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="var(--bg-surface-3)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="url(#timerGrad)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.5s ease' }} />
        <defs>
          <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c5cfc" />
            <stop offset="100%" stopColor="#0fb8d4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="timer-ring-content">{children}</div>
    </div>
  )
}

// ── Session History Row ────────────────────────────────────────
function SessionRow({ session, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const goalTitle = session.goals?.title
  const taskTitle = session.tasks?.title
  const when = new Date(session.started_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  })
  return (
    <div className="session-row">
      <div className="session-row-icon">⏱️</div>
      <div className="session-row-info">
        <p className="session-row-label">{session.label || 'Focus session'}</p>
        <p className="session-row-meta">
          {session.duration_min} min
          {goalTitle && <> · 🎯 {goalTitle}</>}
          {taskTitle && <> · ✅ {taskTitle}</>}
          {' · '}{when}
        </p>
      </div>
      <button className="icon-btn session-del-btn" title="Delete session"
        disabled={deleting}
        onClick={async () => { setDeleting(true); await onDelete(session.id); setDeleting(false) }}>
        {deleting ? '…' : '🗑️'}
      </button>
    </div>
  )
}

// ── Main Focus Timer Page ─────────────────────────────────────
export default function FocusPage() {
  const { sessions, todaySessions, todayMinutes, weekMinutes, saveSession, deleteSession, loading: sessionsLoading } = useFocusSessions()
  const { goals } = useGoals()
  const { tasks } = useTasks()

  // Timer state
  const [preset, setPreset] = useState(25)          // selected minutes
  const [custom, setCustom] = useState('')           // custom minutes input
  const [totalSec, setTotalSec] = useState(25 * 60) // total seconds for session
  const [remaining, setRemaining] = useState(25 * 60)
  const [phase, setPhase] = useState('idle')         // idle | running | paused | done
  const [selectedGoalId, setSelectedGoalId] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [sessionLabel, setSessionLabel] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [startedAt, setStartedAt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const intervalRef = useRef(null)
  const audioCtxRef = useRef(null)

  // Tick
  useEffect(() => {
    if (phase !== 'running') { clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current)
          setPhase('done')
          playDone()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [phase])

  function playDone() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
      osc.start(); osc.stop(ctx.currentTime + 0.65)
    } catch (_) { /* audio not supported */ }
  }

  function applyDuration(minutes) {
    const sec = minutes * 60
    setTotalSec(sec)
    setRemaining(sec)
    setPhase('idle')
  }

  function handlePresetClick(min) {
    setPreset(min); setCustom('')
    applyDuration(min)
  }

  function handleCustomChange(e) {
    const val = e.target.value
    setCustom(val)
    const n = parseInt(val, 10)
    if (n > 0 && n <= 480) {
      setPreset(null)
      applyDuration(n)
    }
  }

  function handleStart() {
    if (phase === 'idle' || phase === 'paused') {
      if (phase === 'idle') setStartedAt(new Date().toISOString())
      setPhase('running')
    }
  }

  function handlePause() { setPhase('paused') }

  function handleReset() {
    clearInterval(intervalRef.current)
    setPhase('idle')
    setRemaining(totalSec)
    setStartedAt(null)
  }

  async function handleSaveSession() {
    const elapsedMin = Math.max(1, Math.round((totalSec - remaining) / 60))
    setSaving(true); setSaveError(null)
    const { error } = await saveSession({
      durationMin: elapsedMin,
      label: sessionLabel || null,
      goalId: selectedGoalId || null,
      taskId: selectedTaskId || null,
      notes: sessionNotes || null,
      startedAt,
    })
    setSaving(false)
    if (error) { setSaveError(error.message); return }
    // Reset timer after save
    handleReset()
    setSessionLabel(''); setSessionNotes('')
    setSelectedGoalId(''); setSelectedTaskId('')
  }

  const elapsed = totalSec - remaining
  const pct = totalSec > 0 ? Math.round((elapsed / totalSec) * 100) : 0
  const activeGoals = goals.filter(g => g.status === 'active')
  const pendingTasks = tasks.filter(t => t.status !== 'done')

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">⏱️ Focus Timer</h1>
          <p className="page-subtitle">Deep work sessions — stay in the zone</p>
        </div>
      </div>

      <div className="focus-layout">
        {/* Left: Timer */}
        <div className="focus-timer-panel">
          {/* Duration presets */}
          <div className="focus-presets">
            {PRESETS.map(p => (
              <button key={p.value}
                id={`preset-${p.value}`}
                className={`focus-preset-btn ${preset === p.value ? 'active' : ''}`}
                onClick={() => handlePresetClick(p.value)}
                disabled={phase === 'running'}
              >
                {p.label}
              </button>
            ))}
            <input
              type="number" min={1} max={480}
              className="focus-custom-input"
              placeholder="Custom"
              value={custom}
              onChange={handleCustomChange}
              disabled={phase === 'running'}
            />
          </div>

          {/* Ring */}
          <div className="focus-ring-container">
            <TimerRing pct={pct} size={260} stroke={12}>
              <div className="timer-display">
                <div className="timer-time">{fmt(remaining)}</div>
                <div className="timer-phase-label">
                  {phase === 'idle' ? 'Ready' : phase === 'running' ? 'Focusing…' : phase === 'paused' ? 'Paused' : '🎉 Done!'}
                </div>
                {phase !== 'idle' && (
                  <div className="timer-elapsed">
                    {Math.round(elapsed / 60)}m elapsed
                  </div>
                )}
              </div>
            </TimerRing>
          </div>

          {/* Controls */}
          <div className="focus-controls">
            {(phase === 'idle' || phase === 'paused') && (
              <button id="btn-timer-start" className="focus-btn focus-btn-start" onClick={handleStart}>
                {phase === 'paused' ? '▶ Resume' : '▶ Start'}
              </button>
            )}
            {phase === 'running' && (
              <button id="btn-timer-pause" className="focus-btn focus-btn-pause" onClick={handlePause}>
                ⏸ Pause
              </button>
            )}
            {phase !== 'idle' && (
              <button id="btn-timer-reset" className="focus-btn focus-btn-reset" onClick={handleReset}>
                ↺ Reset
              </button>
            )}
          </div>

          {/* Done / Save section */}
          {(phase === 'done' || (phase === 'paused' && elapsed >= 60)) && (
            <div className="focus-save-panel">
              <h3 className="focus-save-title">
                {phase === 'done' ? '🎉 Session complete!' : '💾 Save partial session'}
              </h3>
              <p className="focus-save-sub">
                {Math.round(elapsed / 60)} minutes of focused work
              </p>
              {saveError && (
                <div className="auth-alert auth-alert-error">⚠️ {saveError}</div>
              )}
              <div className="form-group">
                <label className="form-label">Session label (optional)</label>
                <input className="form-input" placeholder='e.g. "Working on project proposal"'
                  value={sessionLabel} onChange={e => setSessionLabel(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-input form-textarea" rows={2}
                  placeholder="What did you accomplish?"
                  value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} />
              </div>
              <div className="focus-save-actions">
                <button id="btn-save-session" className="btn-primary" style={{ flex: 1 }}
                  onClick={handleSaveSession} disabled={saving}>
                  {saving ? 'Saving…' : '💾 Save Session'}
                </button>
                <button className="btn-ghost" onClick={handleReset}>Discard</button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Context + History */}
        <div className="focus-sidebar-panel">
          {/* Link to goal/task */}
          <div className="focus-context-card">
            <h3 className="focus-context-title">🔗 Link this session</h3>
            <div className="form-group">
              <label className="form-label">Goal (optional)</label>
              <select className="form-input" value={selectedGoalId}
                onChange={e => setSelectedGoalId(e.target.value)}
                disabled={phase === 'running'}>
                <option value="">— No goal —</option>
                {activeGoals.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Task (optional)</label>
              <select className="form-input" value={selectedTaskId}
                onChange={e => setSelectedTaskId(e.target.value)}
                disabled={phase === 'running'}>
                <option value="">— No task —</option>
                {pendingTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Today's stats */}
          <div className="focus-stats-card">
            <h3 className="focus-context-title">📊 Focus Stats</h3>
            <div className="focus-stats-grid">
              <div className="focus-stat">
                <p className="focus-stat-value">{todayMinutes}</p>
                <p className="focus-stat-label">Min today</p>
              </div>
              <div className="focus-stat">
                <p className="focus-stat-value">{todaySessions.length}</p>
                <p className="focus-stat-label">Sessions today</p>
              </div>
              <div className="focus-stat">
                <p className="focus-stat-value">{weekMinutes}</p>
                <p className="focus-stat-label">Min this week</p>
              </div>
              <div className="focus-stat">
                <p className="focus-stat-value">{sessions.length}</p>
                <p className="focus-stat-label">Total sessions</p>
              </div>
            </div>
          </div>

          {/* Session history */}
          <div className="focus-history-card">
            <h3 className="focus-context-title">📋 Recent Sessions</h3>
            {sessionsLoading ? (
              <div className="loading-spinner" style={{ margin: '16px auto' }} />
            ) : sessions.length === 0 ? (
              <p className="focus-history-empty">No sessions yet. Start your first focus session!</p>
            ) : (
              <div className="focus-history-list">
                {sessions.slice(0, 10).map(s => (
                  <SessionRow key={s.id} session={s} onDelete={id => setDeleteTarget(id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        title="Delete Session" message="Remove this focus session?"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true)
          await deleteSession(deleteTarget)
          setDeleting(false); setDeleteTarget(null)
        }} />
    </div>
  )
}
