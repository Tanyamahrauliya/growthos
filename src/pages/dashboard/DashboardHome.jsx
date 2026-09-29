import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useGoals } from '../../hooks/useGoals'
import { useHabits } from '../../hooks/useHabits'
import { useTasks } from '../../hooks/useTasks'
import { useFocusSessions } from '../../hooks/useFocusSessions'
import { useJournal } from '../../hooks/useJournal'
import { PriorityBadge } from '../../components/ui/Badge'

// ── SVG Progress Ring ─────────────────────────────────────────
function ProgressRing({ pct, size = 64, stroke = 6, color = 'var(--accent-purple)', label }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={size} height={size} className="progress-ring">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-medium)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.6s ease' }} />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          fontSize={size * 0.22} fill="var(--text-primary)" fontWeight="700">
          {pct}%
        </text>
      </svg>
      {label && <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>{label}</p>}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ id, icon, label, value, sub, color, to }) {
  const inner = (
    <div className="stat-card" id={id} style={{ cursor: to ? 'pointer' : 'default' }}>
      <div className="stat-icon-wrap" style={{ background: color + '22' }}>
        <span className="stat-icon">{icon}</span>
      </div>
      <div>
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

// ── Quick Action Button ───────────────────────────────────────
function QuickAction({ icon, label, to, color }) {
  return (
    <Link to={to} className="quick-action" style={{ '--qa-color': color }}>
      <span className="quick-action-icon">{icon}</span>
      <span className="quick-action-label">{label}</span>
    </Link>
  )
}

export default function DashboardHome() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { goals, loading: goalsLoading } = useGoals()
  const { habits, todayLogs, todayProgress, completedToday, totalHabits,
          longestStreak, getStreak, toggleToday, loading: habitsLoading } = useHabits()
  const { todayTasks, overdueTasks, pendingTasks, doneTasks,
          toggleComplete, loading: tasksLoading } = useTasks()
  const { todayMinutes, weekMinutes, todaySessions, loading: focusLoading } = useFocusSessions()
  const { todayEntry, entries, loading: journalLoading } = useJournal()

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const activeGoals = goals.filter(g => g.status === 'active')

  // Task completion score for today
  const todayDone = todayTasks.filter(t => t.status === 'done').length
  const taskScore = todayTasks.length > 0
    ? Math.round((todayDone / todayTasks.length) * 100)
    : 100

  // Focus score: 60 min = 100%
  const focusScore = Math.min(100, Math.round((todayMinutes / 60) * 100))

  // Journal score: 100 if written today, 0 otherwise
  const journalScore = todayEntry ? 100 : 0

  // Overall daily score: habits + tasks + focus (weighted)
  const dataPoints = [
    { score: todayProgress, weight: 2, label: 'Habits' },
    { score: taskScore, weight: 2, label: 'Tasks' },
    { score: focusScore, weight: 1, label: 'Focus' },
    { score: journalScore, weight: 1, label: 'Journal' },
  ]
  const totalWeight = dataPoints.reduce((s, d) => s + d.weight, 0)
  const overallScore = Math.round(
    dataPoints.reduce((s, d) => s + d.score * d.weight, 0) / totalWeight
  )

  const loading = goalsLoading || habitsLoading || tasksLoading || focusLoading

  const [togglingTask, setTogglingTask] = useState(null)
  const [togglingHabit, setTogglingHabit] = useState(null)

  async function handleTaskToggle(task) {
    setTogglingTask(task.id)
    await toggleComplete(task)
    setTogglingTask(null)
  }

  async function handleHabitToggle(habitId) {
    setTogglingHabit(habitId)
    await toggleToday(habitId)
    setTogglingHabit(null)
  }

  return (
    <div className="page-inner">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {displayName} 👋</h1>
          <p className="page-subtitle">{today}</p>
        </div>

        {!loading && (
          <div className="dash-score-cluster">
            <ProgressRing pct={overallScore} size={76} stroke={8}
              color="var(--accent-purple)" label="Daily Score" />
            <div className="dash-score-breakdown">
              {dataPoints.map(d => (
                <div key={d.label} className="dash-score-item">
                  <div className="dash-score-bar-wrap">
                    <div className="dash-score-bar"
                      style={{ width: `${d.score}%`, background: 'var(--gradient-brand)' }} />
                  </div>
                  <span className="dash-score-item-label">{d.label} {d.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        <StatCard id="stat-habits" icon="🔁" label="Habits Today" color="var(--accent-teal)"
          value={habitsLoading ? '…' : `${completedToday}/${totalHabits}`}
          sub={longestStreak > 0 ? `🔥 ${longestStreak} day streak` : undefined}
          to="/dashboard/habits" />
        <StatCard id="stat-tasks" icon="✅" label="Tasks Done" color="var(--accent-green)"
          value={tasksLoading ? '…' : `${todayDone}/${todayTasks.length || 0}`}
          sub={overdueTasks.length > 0 ? `⚠️ ${overdueTasks.length} overdue` : 'All on track'}
          to="/dashboard/tasks" />
        <StatCard id="stat-focus" icon="⏱️" label="Focus Today" color="var(--accent-purple)"
          value={focusLoading ? '…' : `${todayMinutes}m`}
          sub={todaySessions.length > 0 ? `${todaySessions.length} session${todaySessions.length !== 1 ? 's' : ''}` : 'No sessions yet'}
          to="/dashboard/focus" />
        <StatCard id="stat-journal" icon="📓" label="Journal" color="var(--accent-pink)"
          value={journalLoading ? '…' : (todayEntry ? '✓ Written' : 'Not yet')}
          sub={journalLoading ? '' : `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'} total`}
          to="/dashboard/journal" />
      </div>

      {/* ── Quick Actions ── */}
      <div className="quick-actions-row">
        <p className="quick-actions-label">Quick actions</p>
        <div className="quick-actions-grid">
          <QuickAction icon="⏱️" label="Start Focus" to="/dashboard/focus" color="#7c5cfc" />
          <QuickAction icon="📓" label="Write Journal" to="/dashboard/journal" color="#ec4899" />
          <QuickAction icon="🎯" label="View Goals" to="/dashboard/goals" color="#0fb8d4" />
          <QuickAction icon="✅" label="Add Task" to="/dashboard/tasks" color="#22c55e" />
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="dash-main-grid">

        {/* Today's Tasks */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <h2 className="section-title">✅ Today&apos;s Tasks</h2>
            <Link to="/dashboard/tasks" className="section-link">View all →</Link>
          </div>
          {tasksLoading ? (
            <div className="loading-spinner" style={{ margin: '20px auto' }} />
          ) : todayTasks.length === 0 ? (
            <div className="dash-empty">
              <p>No tasks for today.</p>
              <Link to="/dashboard/tasks" className="auth-link">+ Add task</Link>
            </div>
          ) : (
            <div className="dash-task-list">
              {todayTasks.slice(0, 6).map(task => {
                const isDone = task.status === 'done'
                const isToggling = togglingTask === task.id
                return (
                  <div key={task.id} className={`dash-task-row ${isDone ? 'done' : ''}`}>
                    <button className={`task-check ${isDone ? 'checked' : ''}`}
                      onClick={() => handleTaskToggle(task)} disabled={isToggling}>
                      {isToggling ? '…' : isDone ? '✓' : ''}
                    </button>
                    <span className={`dash-task-title ${isDone ? 'line-through' : ''}`}>{task.title}</span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Today's Habits */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <h2 className="section-title">🔁 Today&apos;s Habits</h2>
            <Link to="/dashboard/habits" className="section-link">View all →</Link>
          </div>
          {habitsLoading ? (
            <div className="loading-spinner" style={{ margin: '20px auto' }} />
          ) : habits.length === 0 ? (
            <div className="dash-empty">
              <p>No habits yet.</p>
              <Link to="/dashboard/habits" className="auth-link">+ Add habit</Link>
            </div>
          ) : (
            <>
              <div className="dash-habit-progress">
                <div className="dash-habit-bar">
                  <div className="dash-habit-fill" style={{ width: `${todayProgress}%` }} />
                </div>
                <span className="dash-habit-pct">{todayProgress}%</span>
              </div>
              <div className="dash-habit-list">
                {habits.slice(0, 6).map(habit => {
                  const isDone = todayLogs.includes(habit.id)
                  const isToggling = togglingHabit === habit.id
                  const streak = getStreak(habit.id)
                  return (
                    <div key={habit.id} className={`dash-habit-row ${isDone ? 'done' : ''}`}>
                      <button className={`habit-check-btn small ${isDone ? 'checked' : ''}`}
                        style={{ '--habit-color': habit.color }}
                        onClick={() => handleHabitToggle(habit.id)} disabled={isToggling}>
                        {isToggling ? '…' : isDone ? '✓' : ''}
                      </button>
                      <span className="habit-icon" style={{ fontSize: 16 }}>{habit.icon}</span>
                      <span className={`dash-habit-name ${isDone ? 'line-through' : ''}`}>{habit.name}</span>
                      {streak > 0 && <span className="dash-streak-badge">🔥{streak}</span>}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Focus Time */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <h2 className="section-title">⏱️ Focus Time</h2>
            <Link to="/dashboard/focus" className="section-link">Open →</Link>
          </div>
          {focusLoading ? (
            <div className="loading-spinner" style={{ margin: '20px auto' }} />
          ) : (
            <div className="dash-focus-content">
              <div className="dash-focus-stats">
                <div className="dash-focus-stat">
                  <p className="dash-focus-num">{todayMinutes}</p>
                  <p className="dash-focus-lbl">min today</p>
                </div>
                <div className="dash-focus-divider" />
                <div className="dash-focus-stat">
                  <p className="dash-focus-num">{weekMinutes}</p>
                  <p className="dash-focus-lbl">min this week</p>
                </div>
                <div className="dash-focus-divider" />
                <div className="dash-focus-stat">
                  <p className="dash-focus-num">{todaySessions.length}</p>
                  <p className="dash-focus-lbl">sessions today</p>
                </div>
              </div>
              <div className="dash-focus-bar-wrap">
                <div className="dash-focus-bar">
                  <div className="dash-focus-fill" style={{ width: `${focusScore}%` }} />
                </div>
                <span className="dash-habit-pct">{todayMinutes}/60 min goal</span>
              </div>
              <Link to="/dashboard/focus" className="dash-focus-cta">
                ⏱️ Start a focus session →
              </Link>
            </div>
          )}
        </div>

        {/* Journal */}
        <div className="dash-section-card">
          <div className="dash-section-header">
            <h2 className="section-title">📓 Journal</h2>
            <Link to="/dashboard/journal" className="section-link">View all →</Link>
          </div>
          {journalLoading ? (
            <div className="loading-spinner" style={{ margin: '20px auto' }} />
          ) : !todayEntry ? (
            <div className="dash-journal-nudge">
              <p className="dash-journal-nudge-text">
                📝 You haven&apos;t written today&apos;s entry yet.
              </p>
              <Link to="/dashboard/journal" className="btn-primary"
                style={{ textDecoration: 'none', display: 'inline-block', padding: '9px 18px', fontSize: 13, borderRadius: 6 }}>
                Write now →
              </Link>
            </div>
          ) : (
            <div className="dash-journal-done">
              <p className="dash-journal-done-emoji">{todayEntry.mood ? `${['', '😞', '😕', '😐', '🙂', '😊', '😄', '😁', '🤩', '🚀', '✨'][todayEntry.mood]} Feeling ${todayEntry.mood_label}` : '✅ Entry written'}</p>
              {todayEntry.title && <p className="dash-journal-done-title">"{todayEntry.title}"</p>}
              <p className="dash-journal-done-preview">{todayEntry.content?.slice(0, 100)}…</p>
              <p className="dash-journal-done-count">{entries.length} total entries</p>
            </div>
          )}
        </div>

        {/* Active Goals */}
        <div className="dash-section-card dash-section-wide">
          <div className="dash-section-header">
            <h2 className="section-title">🎯 Active Goals</h2>
            <Link to="/dashboard/goals" className="section-link">View all →</Link>
          </div>
          {goalsLoading ? (
            <div className="loading-spinner" style={{ margin: '20px auto' }} />
          ) : activeGoals.length === 0 ? (
            <div className="dash-empty">
              <p>No active goals.</p>
              <Link to="/dashboard/goals" className="auth-link">+ Add goal</Link>
            </div>
          ) : (
            <div className="dash-goals-grid">
              {activeGoals.slice(0, 4).map(goal => {
                const milestones = goal.milestones ?? []
                const doneMilestones = milestones.filter(m => m.is_completed).length
                return (
                  <div key={goal.id} className="dash-goal-card">
                    <div className="dash-goal-header">
                      <p className="dash-goal-title">{goal.title}</p>
                      {goal.target_date && <span className="dash-goal-date">📅 {goal.target_date}</span>}
                    </div>
                    <div className="goal-progress-wrap">
                      <div className="goal-progress-bar">
                        <div className="goal-progress-fill" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <span className="goal-progress-label">{goal.progress}%</span>
                    </div>
                    {milestones.length > 0 && (
                      <p className="dash-goal-milestones">✅ {doneMilestones}/{milestones.length} milestones</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Overdue Warning */}
        {overdueTasks.length > 0 && (
          <div className="dash-section-card dash-overdue-card">
            <div className="dash-section-header">
              <h2 className="section-title" style={{ color: 'var(--accent-orange)' }}>⚠️ Overdue Tasks</h2>
              <Link to="/dashboard/tasks" className="section-link">Fix →</Link>
            </div>
            <div className="dash-task-list">
              {overdueTasks.slice(0, 4).map(task => (
                <div key={task.id} className="dash-task-row task-overdue">
                  <span className="dash-task-title">{task.title}</span>
                  <span className="task-due overdue">📅 {task.due_date}</span>
                  <PriorityBadge priority={task.priority} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
