import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useSearchParams, Link } from 'react-router-dom'

const TABS = { signin: 'signin', signup: 'signup' }

function FloatingOrb({ style }) {
  return <div className="auth2-orb" style={style} />
}

function GridLines() {
  return <div className="auth2-grid" />
}

function EyeIcon({ show }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {show ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </>
      )}
    </svg>
  )
}

function InputField({ id, name, type, label, placeholder, value, autoComplete, showToggle, show, onToggle, focused, onChange, onFocus, onBlur }) {
  const isFocused = focused === name
  const inputType = showToggle ? (show ? 'text' : 'password') : type

  return (
    <div className={`auth2-field ${isFocused ? 'focused' : ''} ${value ? 'has-value' : ''}`}>
      <label htmlFor={id} className="auth2-label">{label}</label>
      <div className="auth2-input-wrap">
        <input
          id={id}
          name={name}
          type={inputType}
          required
          autoComplete={autoComplete}
          className="auth2-input"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
        />
        {showToggle && (
          <button
            type="button"
            className="auth2-eye"
            onClick={onToggle}
            aria-label={show ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            <EyeIcon show={show} />
          </button>
        )}
        <div className="auth2-input-line" />
      </div>
    </div>
  )
}

export default function AuthPage() {
  const { user, signIn, signUp, loading } = useAuth()
  const [searchParams] = useSearchParams()
  const defaultTab = searchParams.get('mode') === 'signup' ? TABS.signup : TABS.signin

  const [tab, setTab] = useState(defaultTab)
  const [form, setForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '' })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [focused, setFocused] = useState(null)
  const [animDir, setAnimDir] = useState('right')

  if (user) return <Navigate to="/dashboard" replace />
  if (loading) return null

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  function switchTab(newTab) {
    setAnimDir(newTab === TABS.signup ? 'right' : 'left')
    setTab(newTab)
    setError(null)
    setSuccess(null)
    setForm({ email: '', password: '', fullName: '', confirmPassword: '' })
  }

  async function handleSignIn(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(form.email, form.password)
    if (error) setError(error.message)
    setSubmitting(false)
  }

  async function handleSignUp(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      setSubmitting(false)
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      setSubmitting(false)
      return
    }
    const { data, error } = await signUp(form.email, form.password, form.fullName)
    if (error) setError(error.message)
    else if (data?.user && !data?.session) {
      setSuccess('Account created! Check your email to confirm your address.')
    }
    setSubmitting(false)
  }


  return (
    <div className="auth2-page">
      <GridLines />
      <FloatingOrb style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,92,252,0.2) 0%, transparent 70%)', top: '-150px', left: '-150px' }} />
      <FloatingOrb style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(15,184,212,0.15) 0%, transparent 70%)', bottom: '-100px', right: '-100px', animationDelay: '-3s' }} />
      <FloatingOrb style={{ width: 300, height: 300, background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', top: '40%', right: '20%', animationDelay: '-6s' }} />

      {/* Back to home */}
      <Link to="/" className="auth2-back-home" id="auth-back-home">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        <span>Back to Home</span>
      </Link>

      <div className="auth2-card">
        {/* Logo */}
        <div className="auth2-logo">
          <div className="auth2-logo-icon">🌱</div>
          <span className="auth2-logo-text">GrowthOS</span>
        </div>

        {/* Heading */}
        <div className="auth2-heading">
          <h1 className="auth2-title">
            {tab === TABS.signin ? 'Welcome back' : 'Start your journey'}
          </h1>
          <p className="auth2-subtitle">
            {tab === TABS.signin
              ? 'Sign in to continue your growth'
              : 'Create your free account today'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="auth2-tabs" role="tablist">
          <div
            className="auth2-tab-slider"
            style={{ transform: `translateX(${tab === TABS.signin ? '0%' : '100%'})` }}
          />
          <button
            id="auth-tab-signin"
            role="tab"
            aria-selected={tab === TABS.signin}
            className={`auth2-tab ${tab === TABS.signin ? 'active' : ''}`}
            onClick={() => switchTab(TABS.signin)}
          >Sign In</button>
          <button
            id="auth-tab-signup"
            role="tab"
            aria-selected={tab === TABS.signup}
            className={`auth2-tab ${tab === TABS.signup ? 'active' : ''}`}
            onClick={() => switchTab(TABS.signup)}
          >Sign Up</button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="auth2-alert auth2-alert-error" role="alert">
            <span className="auth2-alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="auth2-alert auth2-alert-success" role="alert">
            <span className="auth2-alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </span>
            <span>{success}</span>
          </div>
        )}

        {/* Forms */}
        <div className={`auth2-form-wrap auth2-slide-${animDir}`} key={tab}>
          {tab === TABS.signin ? (
            <form id="form-signin" className="auth2-form" onSubmit={handleSignIn} noValidate>
              <InputField id="signin-email" name="email" type="email" label="Email address" placeholder="you@example.com" value={form.email} autoComplete="email" focused={focused} onChange={handleChange} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
              <InputField id="signin-password" name="password" type="password" label="Password" placeholder="Your password" value={form.password} autoComplete="current-password" showToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} focused={focused} onChange={handleChange} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
              <button id="btn-signin" type="submit" className={`auth2-submit-btn ${submitting ? 'loading' : ''}`} disabled={submitting}>
                {submitting ? (
                  <span className="auth2-btn-content">
                    <span className="auth2-spinner" />
                    Signing in…
                  </span>
                ) : (
                  <span className="auth2-btn-content">
                    Sign In
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                )}
              </button>
              <p className="auth2-switch">
                No account?{' '}
                <button type="button" className="auth2-switch-btn" onClick={() => switchTab(TABS.signup)}>Sign up free</button>
              </p>
            </form>
          ) : (
            <form id="form-signup" className="auth2-form" onSubmit={handleSignUp} noValidate>
              <InputField id="signup-name" name="fullName" type="text" label="Full name" placeholder="Jane Doe" value={form.fullName} autoComplete="name" focused={focused} onChange={handleChange} onFocus={() => setFocused('fullName')} onBlur={() => setFocused(null)} />
              <InputField id="signup-email" name="email" type="email" label="Email address" placeholder="you@example.com" value={form.email} autoComplete="email" focused={focused} onChange={handleChange} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
              <InputField id="signup-password" name="password" type="password" label="Password" placeholder="Min. 8 characters" value={form.password} autoComplete="new-password" showToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} focused={focused} onChange={handleChange} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
              <InputField id="signup-confirm" name="confirmPassword" type="password" label="Confirm password" placeholder="Repeat password" value={form.confirmPassword} autoComplete="new-password" showToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} focused={focused} onChange={handleChange} onFocus={() => setFocused('confirmPassword')} onBlur={() => setFocused(null)} />
              <button id="btn-signup" type="submit" className={`auth2-submit-btn ${submitting ? 'loading' : ''}`} disabled={submitting}>
                {submitting ? (
                  <span className="auth2-btn-content">
                    <span className="auth2-spinner" />
                    Creating account…
                  </span>
                ) : (
                  <span className="auth2-btn-content">
                    Create Account
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                )}
              </button>
              <p className="auth2-switch">
                Already have an account?{' '}
                <button type="button" className="auth2-switch-btn" onClick={() => switchTab(TABS.signin)}>Sign in</button>
              </p>
            </form>
          )}
        </div>

        {/* Footer note */}
        <p className="auth2-terms">
          By continuing, you agree to our{' '}
          <span className="auth2-terms-link">Terms of Service</span> and{' '}
          <span className="auth2-terms-link">Privacy Policy</span>
        </p>
      </div>

      {/* Side branding */}
      <div className="auth2-side">
        <div className="auth2-side-content">
          <div className="auth2-side-quote">
            "The secret of getting ahead is getting started."
          </div>
          <div className="auth2-side-author">— Mark Twain</div>
          <div className="auth2-side-features">
            {[
              { icon: '🎯', text: 'Goal Tracking' },
              { icon: '🔁', text: 'Habit Building' },
              { icon: '📓', text: 'Daily Journaling' },
              { icon: '🤖', text: 'AI Coaching' },
              { icon: '📊', text: 'Growth Analytics' },
            ].map((f, i) => (
              <div key={i} className="auth2-side-pill" style={{ animationDelay: `${i * 0.1}s` }}>
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="auth2-side-orb-1" />
        <div className="auth2-side-orb-2" />
      </div>
    </div>
  )
}
