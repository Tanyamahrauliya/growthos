import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/* ── Intersection Observer reveal hook ───────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ── Animated counter ────────────────────────────────────────── */
function Counter({ target, suffix = '', prefix = '', duration = 2200 }) {
  const [count, setCount] = useState(0)
  const [ref, visible] = useReveal()
  useEffect(() => {
    if (!visible) return
    let raf
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(ease * target))
      if (progress < 1) raf = requestAnimationFrame(tick)
      else setCount(target)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible, target, duration])
  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
}

/* ── Typing effect for hero badge ───────────────────────────── */
function TypedText({ words, speed = 80, pause = 2000 }) {
  const [display, setDisplay] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const word = words[wordIdx]
    let timer
    if (!deleting && charIdx < word.length) {
      timer = setTimeout(() => setCharIdx(c => c + 1), speed)
    } else if (!deleting && charIdx === word.length) {
      timer = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && charIdx > 0) {
      timer = setTimeout(() => setCharIdx(c => c - 1), speed / 2)
    } else if (deleting && charIdx === 0) {
      setDeleting(false)
      setWordIdx(i => (i + 1) % words.length)
    }
    setDisplay(word.slice(0, charIdx))
    return () => clearTimeout(timer)
  }, [charIdx, deleting, wordIdx, words, speed, pause])
  return (
    <span className="lp-typed">
      {display}<span className="lp-typed-cursor">|</span>
    </span>
  )
}

/* ─────────────────────────────────────────────────────────────
   DASHBOARD PREVIEW (live-looking animated mockup)
───────────────────────────────────────────────────────────── */
function DashboardPreview() {
  const [activeNav, setActiveNav] = useState(0)
  const [barHeights] = useState([68, 85, 55, 92, 78, 96, 72])
  const [goalPcts] = useState([88, 62, 45, 100])
  const goalNames = ['Launch MVP', 'Read 24 Books', 'Exercise Daily', 'Learn Spanish']
  const goalColors = ['#7c5cfc', '#0fb8d4', '#ec4899', '#22c55e']
  const navItems = [
    { icon: '🎯', label: 'Goals' },
    { icon: '🔁', label: 'Habits' },
    { icon: '✅', label: 'Tasks' },
    { icon: '⏱️', label: 'Focus' },
    { icon: '📓', label: 'Journal' },
    { icon: '🤖', label: 'Coach' },
  ]
  const statCards = [
    { icon: '🎯', val: '4', label: 'Active Goals', color: '#7c5cfc' },
    { icon: '🔥', val: '28', label: 'Day Streak', color: '#f97316' },
    { icon: '✅', val: '12', label: 'Tasks Done', color: '#22c55e' },
    { icon: '⏱️', val: '3.5h', label: 'Focus Time', color: '#0fb8d4' },
  ]

  useEffect(() => {
    const t = setInterval(() => setActiveNav(p => (p + 1) % navItems.length), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="lp-preview-shell">
      {/* Glow behind window */}
      <div className="lp-preview-glow" />

      {/* Floating badge cards */}
      <div className="lp-preview-float lp-preview-float-1">
        <span className="lp-preview-float-icon">🔥</span>
        <div>
          <div className="lp-preview-float-title">28-day streak!</div>
          <div className="lp-preview-float-sub">Keep it going</div>
        </div>
      </div>
      <div className="lp-preview-float lp-preview-float-2">
        <span className="lp-preview-float-icon">🤖</span>
        <div>
          <div className="lp-preview-float-title">AI Coach ready</div>
          <div className="lp-preview-float-sub">3 suggestions</div>
        </div>
      </div>

      {/* Browser window */}
      <div className="lp-preview-window">
        <div className="lp-preview-titlebar">
          <div className="lp-preview-dots">
            <span style={{ background: '#ff5f57' }} />
            <span style={{ background: '#febc2e' }} />
            <span style={{ background: '#28c840' }} />
          </div>
          <div className="lp-preview-url">
            <span className="lp-preview-url-lock">🔒</span>
            app.growthos.io/dashboard
          </div>
        </div>

        <div className="lp-preview-body">
          {/* Sidebar */}
          <div className="lp-preview-sidebar">
            <div className="lp-preview-brand">
              <span>🌱</span>
              <span>GrowthOS</span>
            </div>
            <div className="lp-preview-user-pill">
              <div className="lp-preview-user-dot" />
              <span>Alex Chen</span>
            </div>
            <div className="lp-preview-nav">
              {navItems.map((item, i) => (
                <div
                  key={i}
                  className={`lp-preview-nav-item ${i === activeNav ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="lp-preview-main">
            {/* Top bar */}
            <div className="lp-preview-topbar">
              <div>
                <div className="lp-preview-greeting">Good morning, Alex 👋</div>
                <div className="lp-preview-date">Saturday · Sep 28 · Daily score: 87%</div>
              </div>
              <div className="lp-preview-avatar">AC</div>
            </div>

            {/* Stats */}
            <div className="lp-preview-stats">
              {statCards.map((s, i) => (
                <div key={i} className="lp-preview-stat-card" style={{ '--c': s.color }}>
                  <div className="lp-preview-stat-top">
                    <span className="lp-preview-stat-icon">{s.icon}</span>
                    <div className="lp-preview-stat-dot" style={{ background: s.color }} />
                  </div>
                  <span className="lp-preview-stat-val">{s.val}</span>
                  <span className="lp-preview-stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Two columns */}
            <div className="lp-preview-cols">
              <div className="lp-preview-col">
                <div className="lp-preview-section-title">Goal Progress</div>
                <div className="lp-preview-goals">
                  {goalPcts.map((pct, i) => (
                    <div key={i} className="lp-preview-goal-row">
                      <span className="lp-preview-goal-dot" style={{ background: goalColors[i] }} />
                      <span className="lp-preview-goal-name">{goalNames[i]}</span>
                      <div className="lp-preview-goal-bar">
                        <div
                          className="lp-preview-goal-fill"
                          style={{ width: `${pct}%`, background: goalColors[i] }}
                        />
                      </div>
                      <span className="lp-preview-goal-pct">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-preview-col">
                <div className="lp-preview-section-title">Weekly Habits</div>
                <div className="lp-preview-habit-chart">
                  {barHeights.map((h, i) => (
                    <div key={i} className="lp-preview-habit-bar-wrap">
                      <div className="lp-preview-habit-bar" style={{ height: `${h}%` }} />
                      <span className="lp-preview-habit-day">
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Mini AI widget */}
                <div className="lp-preview-ai-widget">
                  <span className="lp-preview-ai-icon">🤖</span>
                  <span className="lp-preview-ai-text">Your focus time is up 40% this week!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────────── */
function Navbar({ navigate }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const close = () => setMenuOpen(false)
  return (
    <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
      <div className="lp-nav-inner">
        <a href="#hero" className="lp-nav-logo" id="nav-logo">
          <span className="lp-nav-logo-icon">🌱</span>
          <span className="lp-nav-logo-text">GrowthOS</span>
        </a>

        <div className={`lp-nav-links ${menuOpen ? 'open' : ''}`}>
          <a href="#features" className="lp-nav-link" onClick={close}>Features</a>
          <a href="#how-it-works" className="lp-nav-link" onClick={close}>How It Works</a>
          <a href="#testimonials" className="lp-nav-link" onClick={close}>Reviews</a>
        </div>

        <div className="lp-nav-actions">
          <button id="nav-signin" className="lp-nav-link" onClick={() => navigate('/auth')}>
            Sign In
          </button>
          <button id="nav-cta" className="lp-btn-primary lp-btn-sm" onClick={() => navigate('/auth?mode=signup')}>
            Get Started Free
            <span className="lp-btn-arrow">→</span>
          </button>
          <button
            className="lp-hamburger"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen(m => !m)}
          >
            <span className={`lp-hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`lp-hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`lp-hamburger-line ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </div>
    </nav>
  )
}

/* ─────────────────────────────────────────────────────────────
   FEATURE CARD (glassmorphism)
───────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: '🎯', title: 'Goal Tracking',
    desc: 'Break big dreams into milestones with progress rings, deadlines, and visual momentum tracking.',
    color: '#7c5cfc', tag: 'Core',
  },
  {
    icon: '🔁', title: 'Habit Builder',
    desc: 'Build powerful streaks with daily habit tracking. Smart insights surface patterns automatically.',
    color: '#0fb8d4', tag: 'Core',
  },
  {
    icon: '✅', title: 'Smart Tasks',
    desc: 'Priority-driven task management linked to your goals — so every action moves the needle.',
    color: '#22c55e', tag: 'Productivity',
  },
  {
    icon: '⏱️', title: 'Focus Timer',
    desc: 'Pomodoro-style deep work sessions with session history and linked goal/task tracking.',
    color: '#f97316', tag: 'Focus',
  },
  {
    icon: '📓', title: 'Guided Journal',
    desc: 'Daily reflections with mood tracking and AI-surfaced patterns across your entries.',
    color: '#ec4899', tag: 'Reflection',
  },
  {
    icon: '📊', title: 'Analytics',
    desc: 'Beautiful dashboards showing your growth trajectory with weekly score breakdowns.',
    color: '#a78bfa', tag: 'Insights',
  },
  {
    icon: '🤖', title: 'AI Coach',
    desc: 'Your personal AI mentor powered by Gemini. Weekly analysis, next-week plans, and 24/7 chat.',
    color: '#38bdf8', tag: 'AI-Powered',
  },
  {
    icon: '🏆', title: 'Milestones',
    desc: 'Break goals into checkpoints. Celebrate micro-wins that compound into life transformation.',
    color: '#fbbf24', tag: 'Core',
  },
]

function FeatureCard({ feature, index }) {
  const [ref, visible] = useReveal()
  return (
    <div
      ref={ref}
      className={`lp-feature-card ${visible ? 'lp-reveal' : ''}`}
      style={{ animationDelay: `${(index % 4) * 0.08}s`, '--feature-color': feature.color }}
    >
      <div className="lp-feature-card-bg" />
      <div className="lp-feature-tag" style={{ color: feature.color, borderColor: `${feature.color}40`, background: `${feature.color}10` }}>
        {feature.tag}
      </div>
      <div className="lp-feature-icon-wrap" style={{ background: `${feature.color}15`, boxShadow: `0 0 0 1px ${feature.color}20` }}>
        <span className="lp-feature-icon">{feature.icon}</span>
      </div>
      <h3 className="lp-feature-title">{feature.title}</h3>
      <p className="lp-feature-desc">{feature.desc}</p>
      <div className="lp-feature-arrow">→</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   STEP CARD
───────────────────────────────────────────────────────────── */
function StepCard({ step, index }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className={`lp-step-card ${visible ? 'lp-reveal' : ''}`} style={{ animationDelay: `${index * 0.13}s` }}>
      <div className="lp-step-num-wrap">
        <div className="lp-step-num">{step.num}</div>
        <div className="lp-step-connector" />
      </div>
      <div className="lp-step-icon-wrap">
        <span className="lp-step-icon">{step.icon}</span>
      </div>
      <h3 className="lp-step-title">{step.title}</h3>
      <p className="lp-step-desc">{step.desc}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   TESTIMONIAL CARD
───────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    name: 'Priya Sharma', role: 'Product Manager @ Stripe', avatar: 'PS', color: '#7c5cfc',
    text: 'GrowthOS completely transformed how I track my goals. The AI Coach feels like having a personal mentor on call 24/7. My productivity tripled in 3 months.',
    stars: 5,
  },
  {
    name: 'Alex Chen', role: 'Software Engineer @ Vercel', avatar: 'AC', color: '#0fb8d4',
    text: "The habit streak system is addictive in the best way. I've maintained a 90-day coding streak and shipped more projects than in all of last year combined.",
    stars: 5,
  },
  {
    name: 'Jordan Lee', role: 'Founder, StartupX', avatar: 'JL', color: '#ec4899',
    text: 'Finally, one place for goals, tasks, journaling and focus. The weekly AI analysis caught a pattern in my habits I never would have noticed myself.',
    stars: 5,
  },
]

function TestimonialCard({ t, index }) {
  const [ref, visible] = useReveal()
  return (
    <div ref={ref} className={`lp-testimonial-card ${visible ? 'lp-reveal' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="lp-testimonial-top">
        <div className="lp-testimonial-stars">{'★'.repeat(t.stars)}</div>
        <div className="lp-testimonial-verified">✓ Verified</div>
      </div>
      <p className="lp-testimonial-text">"{t.text}"</p>
      <div className="lp-testimonial-author">
        <div className="lp-testimonial-avatar" style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}99)` }}>
          {t.avatar}
        </div>
        <div>
          <div className="lp-testimonial-name">{t.name}</div>
          <div className="lp-testimonial-role">{t.role}</div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   SOCIAL PROOF LOGOS STRIP
───────────────────────────────────────────────────────────── */
function LogoStrip() {
  const logos = ['Notion', 'Linear', 'Figma', 'Vercel', 'Stripe', 'Supabase', 'Arc', 'Raycast']
  return (
    <div className="lp-logos-section">
      <p className="lp-logos-label">Trusted by teams at</p>
      <div className="lp-logos-track">
        <div className="lp-logos-inner">
          {[...logos, ...logos].map((l, i) => (
            <div key={i} className="lp-logo-pill">{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [ctaHover, setCtaHover] = useState(false)
  const [headerRef, headerVisible] = useReveal(0.05)
  const [statsRef, statsVisible] = useReveal()
  const [ctaRef, ctaVisible] = useReveal()

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  if (loading) return null

  const steps = [
    { num: '01', title: 'Set Clear Goals', desc: 'Define what matters most. Add milestones, deadlines and success metrics.', icon: '🎯' },
    { num: '02', title: 'Build Daily Habits', desc: 'Design routines that compound. Track streaks and build unstoppable momentum.', icon: '🔁' },
    { num: '03', title: 'Deep Work & Reflect', desc: 'Time-box focused sessions. Journal daily and let AI surface your patterns.', icon: '📓' },
    { num: '04', title: 'Grow Exponentially', desc: 'Your analytics trend upward as compounding effort transforms your life.', icon: '📈' },
  ]

  const STATS = [
    { value: 12000, suffix: '+', label: 'Active Users', icon: '👥' },
    { value: 98, suffix: '%', label: 'Completion Rate', icon: '🏆' },
    { value: 3000000, suffix: '+', label: 'Habits Tracked', icon: '🔁' },
    { value: 4, prefix: '', suffix: '.9★', label: 'Average Rating', icon: '⭐' },
  ]

  return (
    <div className="lp-root">
      <Navbar navigate={navigate} />

      <main>
        {/* ════════════════════════════════
            HERO SECTION
        ════════════════════════════════ */}
        <section className="lp-hero" id="hero">
          {/* Background layers */}
          <div className="lp-hero-bg" />
          <div className="lp-hero-grid" />
          <div className="lp-hero-orb lp-hero-orb-1" />
          <div className="lp-hero-orb lp-hero-orb-2" />
          <div className="lp-hero-orb lp-hero-orb-3" />
          <div className="lp-hero-noise" />

          <div className="lp-hero-inner">
            {/* Left: copy */}
            <div className="lp-hero-content">
              <div className="lp-hero-badge">
                <span className="lp-badge-dot" />
                <span>AI-Powered · Free to start · No credit card</span>
              </div>

              <h1 className="lp-hero-headline">
                Build the habits.<br />
                Crush the goals.<br />
                <TypedText
                  words={['Become unstoppable.', 'Track your growth.', 'Own your future.']}
                />
              </h1>

              <p className="lp-hero-sub">
                GrowthOS is the all-in-one operating system for personal growth —
                goals, habits, tasks, focus, journaling, and an AI coach unified in one beautiful app.
              </p>

              <div className="lp-hero-ctas">
                <button
                  id="hero-cta-start"
                  className="lp-btn-primary lp-btn-large lp-btn-glow"
                  onClick={() => navigate('/auth?mode=signup')}
                  onMouseEnter={() => setCtaHover(true)}
                  onMouseLeave={() => setCtaHover(false)}
                >
                  <span>Start for Free</span>
                  <span className={`lp-btn-arrow ${ctaHover ? 'nudge' : ''}`}>→</span>
                </button>
                <button
                  id="hero-cta-signin"
                  className="lp-btn-ghost lp-btn-large"
                  onClick={() => navigate('/auth')}
                >
                  Sign In
                </button>
              </div>

              {/* Social proof row */}
              <div className="lp-hero-social">
                <div className="lp-hero-avatars">
                  {['#7c5cfc', '#0fb8d4', '#ec4899', '#22c55e', '#f97316'].map((c, i) => (
                    <div
                      key={i}
                      className="lp-hero-mini-avatar"
                      style={{ background: `linear-gradient(135deg, ${c}, ${c}99)`, marginLeft: i > 0 ? -10 : 0 }}
                    />
                  ))}
                </div>
                <div>
                  <div className="lp-hero-social-rating">★★★★★</div>
                  <span className="lp-hero-social-text">
                    Loved by <strong>12,000+</strong> growth-focused people
                  </span>
                </div>
              </div>
            </div>

            {/* Right: dashboard preview */}
            <div className="lp-hero-visual">
              <DashboardPreview />
            </div>
          </div>

          {/* Scroll cue */}
          <div className="lp-scroll-cue">
            <div className="lp-scroll-mouse">
              <div className="lp-scroll-wheel" />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            LOGO STRIP
        ════════════════════════════════ */}
        <LogoStrip />

        {/* ════════════════════════════════
            STATS BAND
        ════════════════════════════════ */}
        <section className="lp-stats-section" ref={statsRef}>
          <div className="lp-container">
            <div className="lp-stats-grid">
              {STATS.map((s, i) => (
                <div key={i} className={`lp-stat-item ${statsVisible ? 'lp-reveal' : ''}`} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="lp-stat-icon">{s.icon}</div>
                  <div className="lp-stat-value">
                    {statsVisible && <Counter target={s.value} suffix={s.suffix} prefix={s.prefix} />}
                  </div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            FEATURES GRID
        ════════════════════════════════ */}
        <section className="lp-features-section" id="features">
          <div className="lp-container">
            <div ref={headerRef} className={`lp-section-header ${headerVisible ? 'lp-reveal' : ''}`}>
              <div className="lp-section-badge">Everything You Need</div>
              <h2 className="lp-section-title">
                One platform,{' '}
                <span className="lp-gradient-text">infinite growth</span>
              </h2>
              <p className="lp-section-sub">
                Every tool you need to become the best version of yourself —
                elegantly unified and AI-powered.
              </p>
            </div>
            <div className="lp-features-grid">
              {FEATURES.map((f, i) => <FeatureCard key={i} feature={f} index={i} />)}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            HOW IT WORKS
        ════════════════════════════════ */}
        <section className="lp-how-section" id="how-it-works">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal" style={{ animationDelay: '0s' }}>
              <div className="lp-section-badge">How It Works</div>
              <h2 className="lp-section-title">
                From intention{' '}
                <span className="lp-gradient-text">to transformation</span>
              </h2>
              <p className="lp-section-sub">
                A proven system that turns your scattered ambitions into focused, measurable momentum.
              </p>
            </div>
            <div className="lp-steps-grid">
              {steps.map((s, i) => <StepCard key={i} step={s} index={i} />)}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            AI COACH HIGHLIGHT BAND
        ════════════════════════════════ */}
        <section className="lp-ai-band">
          <div className="lp-ai-band-orb-1" />
          <div className="lp-ai-band-orb-2" />
          <div className="lp-container lp-ai-band-inner">
            <div className="lp-ai-band-content">
              <div className="lp-section-badge">AI-Powered</div>
              <h2 className="lp-section-title" style={{ textAlign: 'left', margin: 0 }}>
                Your personal AI coach,{' '}
                <span className="lp-gradient-text">always on.</span>
              </h2>
              <p className="lp-section-sub" style={{ textAlign: 'left', margin: '16px 0 32px' }}>
                Powered by Gemini. Knows your goals, habits and journal. 
                Gives you a weekly breakdown, personalized next-week plan, and 24/7 conversational coaching.
              </p>
              <div className="lp-ai-pills">
                {['📊 Weekly Analysis', '🗓️ Next Week Plan', '💬 24/7 Chat Coach', '🔍 Pattern Recognition'].map((p, i) => (
                  <div key={i} className="lp-ai-pill">{p}</div>
                ))}
              </div>
            </div>
            <div className="lp-ai-band-visual">
              <div className="lp-ai-chat-mock">
                <div className="lp-ai-chat-header">
                  <span>🤖</span>
                  <span>AI Growth Coach</span>
                  <div className="lp-ai-chat-status" />
                </div>
                {[
                  { role: 'user', text: 'How did I do this week?' },
                  { role: 'coach', text: "Great week! 🎉 You hit 92% of your habits and logged 6.5h of deep focus. Your morning run streak is at 14 days — your longest yet! One area to watch: 3 tasks slipped past their deadline. Let's look at prioritization next week." },
                  { role: 'user', text: 'What should I focus on tomorrow?' },
                  { role: 'coach', text: "Based on your goals, I'd prioritize the MVP launch checklist (2h focus block) and your daily reading habit. Your energy data shows you're sharpest 9–11am. 🚀" },
                ].map((m, i) => (
                  <div key={i} className={`lp-ai-msg lp-ai-msg-${m.role}`}>
                    {m.role === 'coach' && <span className="lp-ai-msg-avatar">🤖</span>}
                    <div className="lp-ai-msg-bubble">{m.text}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            TESTIMONIALS
        ════════════════════════════════ */}
        <section className="lp-testimonials-section" id="testimonials">
          <div className="lp-container">
            <div className="lp-section-header lp-reveal">
              <div className="lp-section-badge">Loved By Users</div>
              <h2 className="lp-section-title">
                Real people,{' '}
                <span className="lp-gradient-text">real results</span>
              </h2>
              <p className="lp-section-sub">
                Join thousands building better habits, crushing goals, and unlocking their potential.
              </p>
            </div>
            <div className="lp-testimonials-grid">
              {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} t={t} index={i} />)}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════
            FINAL CTA
        ════════════════════════════════ */}
        <section className="lp-cta-section">
          <div className="lp-cta-orb-1" />
          <div className="lp-cta-orb-2" />
          <div className="lp-cta-mesh" />
          <div className="lp-container">
            <div
              ref={ctaRef}
              className={`lp-cta-panel ${ctaVisible ? 'lp-reveal' : ''}`}
            >
              <div className="lp-cta-panel-glow" />
              <div className="lp-cta-content">
                <div className="lp-cta-badge">🌱 Free to Start — No Credit Card</div>
                <h2 className="lp-cta-title">
                  Ready to Turn Your Goals{' '}
                  <span className="lp-gradient-text">Into Progress?</span>
                </h2>
                <p className="lp-cta-sub">
                  GrowthOS helps you plan what matters, track your habits daily, 
                  reflect with guided journaling, and continuously improve with AI-powered coaching — 
                  all in one focused space.
                </p>
                <div className="lp-cta-buttons">
                  <button
                    id="cta-get-started"
                    className="lp-btn-primary lp-btn-large lp-btn-glow"
                    onClick={() => navigate('/auth?mode=signup')}
                  >
                    <span>Start Growing Free</span>
                    <span className="lp-btn-arrow">→</span>
                  </button>
                  <button
                    id="cta-explore"
                    className="lp-btn-ghost lp-btn-large"
                    onClick={() => navigate('/auth')}
                  >
                    Explore GrowthOS
                  </button>
                </div>
                <div className="lp-cta-trust">
                  <span>✓ No credit card required</span>
                  <span className="lp-cta-trust-dot">·</span>
                  <span>✓ Free forever plan</span>
                  <span className="lp-cta-trust-dot">·</span>
                  <span>✓ Set up in 2 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            {/* Brand Column */}
            <div className="lp-footer-brand-col">
              <div className="lp-footer-brand">
                <span className="lp-footer-logo-icon">🌱</span>
                <span className="lp-footer-name">GrowthOS</span>
              </div>
              <p className="lp-footer-desc">
                Your personal AI-powered operating system for growth, focus, and continuous improvement.
              </p>
            </div>

            {/* Product Column */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Product</h4>
              <div className="lp-footer-links">
                <Link to="/dashboard" className="lp-footer-link">Dashboard</Link>
                <Link to="/dashboard/goals" className="lp-footer-link">Goals</Link>
                <Link to="/dashboard/habits" className="lp-footer-link">Habits</Link>
                <Link to="/dashboard/tasks" className="lp-footer-link">Tasks</Link>
                <Link to="/dashboard/focus" className="lp-footer-link">Focus</Link>
                <Link to="/dashboard/journal" className="lp-footer-link">Journal</Link>
                <Link to="/dashboard/analytics" className="lp-footer-link">Analytics</Link>
                <Link to="/dashboard/coach" className="lp-footer-link">AI Coach</Link>
              </div>
            </div>

            {/* Resources Column */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Resources</h4>
              <div className="lp-footer-links">
                <a href="#features" className="lp-footer-link">Features</a>
                <a href="#how-it-works" className="lp-footer-link">How It Works</a>
                <a href="#faq" className="lp-footer-link">FAQ</a>
              </div>
            </div>

            {/* Account Column */}
            <div className="lp-footer-col">
              <h4 className="lp-footer-col-title">Account</h4>
              <div className="lp-footer-links">
                <Link to="/auth" className="lp-footer-link">Login</Link>
                <Link to="/auth" className="lp-footer-link">Sign Up</Link>
              </div>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <p className="lp-footer-copy">
              © {new Date().getFullYear()} GrowthOS. All rights reserved.
            </p>
            <div className="lp-footer-legal">
              <Link to="/privacy" className="lp-footer-link">Privacy Policy</Link>
              <Link to="/terms" className="lp-footer-link">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
