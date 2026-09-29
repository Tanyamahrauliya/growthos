import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const STEPS = [
  { id: 'welcome', title: 'Welcome to GrowthOS 🌱' },
  { id: 'profile', title: 'Tell us about yourself' },
  { id: 'first_goal', title: 'Set your first goal 🎯' },
  { id: 'first_habit', title: 'Build your first habit 🔁' },
  { id: 'done', title: "You're all set! 🎉" },
]

const GOAL_CATEGORIES = ['health', 'career', 'learning', 'finance', 'relationships', 'creativity', 'mindfulness', 'fitness']
const HABIT_ICONS = ['💪', '📚', '🧘', '🏃', '💧', '🥗', '✍️', '🎯', '💤', '🙏', '🎨', '💻']

export default function OnboardingPage() {
  const { user, profile, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [profileForm, setProfileForm] = useState({ full_name: profile?.full_name || '', bio: '' })
  const [goalForm, setGoalForm] = useState({ title: '', description: '', category: 'health', target_date: '' })
  const [habitForm, setHabitForm] = useState({ name: '', icon: '💪', color: '#7c5cfc', frequency: 'daily' })
  const [skipGoal, setSkipGoal] = useState(false)
  const [skipHabit, setSkipHabit] = useState(false)

  async function handleNext() {
    setError(null)
    const currentStep = STEPS[step].id

    if (currentStep === 'profile') {
      if (!profileForm.full_name.trim()) { setError('Please enter your name.'); return }
      setSaving(true)
      const { error } = await updateProfile({ full_name: profileForm.full_name, bio: profileForm.bio })
      setSaving(false)
      if (error) { setError(error.message); return }
    }

    if (currentStep === 'first_goal' && !skipGoal) {
      if (!goalForm.title.trim()) { setError('Please enter a goal title.'); return }
      setSaving(true)
      const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        title: goalForm.title,
        description: goalForm.description,
        category: goalForm.category,
        target_date: goalForm.target_date || null,
      })
      setSaving(false)
      if (error) { setError(error.message); return }
    }

    if (currentStep === 'first_habit' && !skipHabit) {
      if (!habitForm.name.trim()) { setError('Please enter a habit name.'); return }
      setSaving(true)
      const { error } = await supabase.from('habits').insert({
        user_id: user.id,
        name: habitForm.name,
        icon: habitForm.icon,
        color: habitForm.color,
        frequency: habitForm.frequency,
      })
      setSaving(false)
      if (error) { setError(error.message); return }
    }

    if (currentStep === 'done') {
      setSaving(true)
      await updateProfile({ onboarding_completed: true })
      setSaving(false)
      navigate('/dashboard', { replace: true })
      return
    }

    setStep(s => s + 1)
  }

  const progress = ((step) / (STEPS.length - 1)) * 100

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Progress bar */}
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p className="onboarding-step-counter">Step {step + 1} of {STEPS.length}</p>

        <div className="onboarding-card">
          <h1 className="onboarding-title">{STEPS[step].title}</h1>

          {error && (
            <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          {/* STEP: welcome */}
          {STEPS[step].id === 'welcome' && (
            <div className="onboarding-welcome">
              <div className="onboarding-welcome-icon">🌱</div>
              <p className="onboarding-welcome-text">
                GrowthOS is your personal operating system for becoming the best version of yourself.
                In the next few steps, we&apos;ll set up your profile, your first goal, and your first habit.
              </p>
              <div className="onboarding-feature-list">
                {[
                  ['🎯', 'Track goals with milestones & progress'],
                  ['🔁', 'Build habits with streak tracking'],
                  ['✅', 'Manage tasks with priorities & due dates'],
                  ['📊', 'See your daily growth at a glance'],
                ].map(([icon, text]) => (
                  <div key={text} className="onboarding-feature-item">
                    <span>{icon}</span><span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP: profile */}
          {STEPS[step].id === 'profile' && (
            <div className="onboarding-form">
              <div className="form-group">
                <label htmlFor="ob-name" className="form-label">Your name *</label>
                <input id="ob-name" type="text" className="form-input" placeholder="Jane Doe"
                  value={profileForm.full_name}
                  onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label htmlFor="ob-bio" className="form-label">Short bio (optional)</label>
                <textarea id="ob-bio" className="form-input form-textarea" placeholder="What are you working towards?"
                  rows={3} value={profileForm.bio}
                  onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))} />
              </div>
            </div>
          )}

          {/* STEP: first goal */}
          {STEPS[step].id === 'first_goal' && (
            <div className="onboarding-form">
              {!skipGoal ? (
                <>
                  <div className="form-group">
                    <label htmlFor="ob-goal-title" className="form-label">Goal title *</label>
                    <input id="ob-goal-title" type="text" className="form-input" placeholder="e.g. Run a 5K by December"
                      value={goalForm.title}
                      onChange={e => setGoalForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="ob-goal-desc" className="form-label">Description (optional)</label>
                    <textarea id="ob-goal-desc" className="form-input form-textarea" rows={2}
                      placeholder="Why does this goal matter to you?"
                      value={goalForm.description}
                      onChange={e => setGoalForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <div className="category-grid">
                      {GOAL_CATEGORIES.map(cat => (
                        <button key={cat} type="button"
                          className={`category-chip ${goalForm.category === cat ? 'active' : ''}`}
                          onClick={() => setGoalForm(p => ({ ...p, category: cat }))}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ob-goal-date" className="form-label">Target date (optional)</label>
                    <input id="ob-goal-date" type="date" className="form-input"
                      value={goalForm.target_date}
                      onChange={e => setGoalForm(p => ({ ...p, target_date: e.target.value }))} />
                  </div>
                </>
              ) : (
                <p className="onboarding-skip-msg">Goal skipped. You can add goals from the Goals page anytime.</p>
              )}
              <button className="btn-ghost" style={{ marginTop: 4 }} onClick={() => setSkipGoal(s => !s)}>
                {skipGoal ? 'Add a goal instead' : 'Skip this step'}
              </button>
            </div>
          )}

          {/* STEP: first habit */}
          {STEPS[step].id === 'first_habit' && (
            <div className="onboarding-form">
              {!skipHabit ? (
                <>
                  <div className="form-group">
                    <label htmlFor="ob-habit-name" className="form-label">Habit name *</label>
                    <input id="ob-habit-name" type="text" className="form-input" placeholder="e.g. Morning run"
                      value={habitForm.name}
                      onChange={e => setHabitForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pick an icon</label>
                    <div className="icon-grid">
                      {HABIT_ICONS.map(icon => (
                        <button key={icon} type="button"
                          className={`icon-chip ${habitForm.icon === icon ? 'active' : ''}`}
                          onClick={() => setHabitForm(p => ({ ...p, icon }))}>
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="ob-habit-freq" className="form-label">Frequency</label>
                    <select id="ob-habit-freq" className="form-input"
                      value={habitForm.frequency}
                      onChange={e => setHabitForm(p => ({ ...p, frequency: e.target.value }))}>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </>
              ) : (
                <p className="onboarding-skip-msg">Habit skipped. You can add habits from the Habits page anytime.</p>
              )}
              <button className="btn-ghost" style={{ marginTop: 4 }} onClick={() => setSkipHabit(s => !s)}>
                {skipHabit ? 'Add a habit instead' : 'Skip this step'}
              </button>
            </div>
          )}

          {/* STEP: done */}
          {STEPS[step].id === 'done' && (
            <div className="onboarding-welcome">
              <div className="onboarding-welcome-icon">🎉</div>
              <p className="onboarding-welcome-text">
                Your GrowthOS is ready! Head to your dashboard to see your goals and habits, or start adding tasks for today.
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                You can always update your profile and add more goals, habits, and tasks from the navigation.
              </p>
            </div>
          )}

          <div className="onboarding-actions">
            {step > 0 && STEPS[step].id !== 'done' && (
              <button className="btn-ghost" onClick={() => { setStep(s => s - 1); setError(null) }}>
                ← Back
              </button>
            )}
            <button id="btn-onboarding-next" className="btn-primary" style={{ width: 'auto', paddingInline: 36 }}
              onClick={handleNext} disabled={saving}>
              {saving ? 'Saving…' : STEPS[step].id === 'done' ? '🚀 Go to Dashboard' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
