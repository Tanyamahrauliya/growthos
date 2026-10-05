import { useState, useRef, useEffect } from 'react'
import { useCoach } from '../../hooks/useCoach'
import ReactMarkdown from 'react-markdown'

/* ── Typing animation ─────────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 8 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'var(--gradient-brand)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, flexShrink: 0,
      }}>🤖</div>
      <div style={{
        padding: '12px 18px',
        borderRadius: 16, borderBottomLeftRadius: 4,
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>AI is thinking</span>
        <div className="typing-indicator" style={{ display: 'flex', gap: 4 }}>
          <span className="dot" /><span className="dot" /><span className="dot" />
        </div>
      </div>
    </div>
  )
}

/* ── Dismissable error alert ─────────────────────────────────────────────── */
function ErrorAlert({ message, onDismiss }) {
  // Detect "server not running" to show a helpful hint
  const isServerDown = message && message.toLowerCase().includes('cannot reach')
  return (
    <div style={{
      padding: '14px 16px',
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 'var(--radius-md)',
      marginBottom: 16,
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      animation: 'lp-slide-up 0.3s ease forwards',
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#fca5a5', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message}</div>
        {isServerDown && (
          <div style={{
            marginTop: 8, padding: '6px 12px',
            background: 'rgba(0,0,0,0.25)', borderRadius: 6,
            fontFamily: 'monospace', fontSize: 12, color: '#86efac',
          }}>
            npm run dev:server
          </div>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
      >×</button>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────────────────── */
function EmptyState({ emoji, title, body }) {
  return (
    <div className="dash-empty" style={{ marginTop: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{emoji}</div>
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{body}</p>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function CoachPage() {
  const { analyzeWeek, createPlan, sendChatMessage, loading, error } = useCoach()

  const [activeTab, setActiveTab] = useState('chat')
  const [analysisResult, setAnalysisResult] = useState('')
  const [planResult, setPlanResult] = useState('')
  const [localError, setLocalError] = useState(null)

  const [messages, setMessages] = useState([
    {
      role: 'coach',
      content:
        "Hi! 👋 I'm your **GrowthOS AI Coach**.\n\nI have access to your goals, habits, tasks, focus sessions, and journal — so I can give you **personalized, data-driven guidance**.\n\nTry asking:\n- *\"How did I do this week?\"*\n- *\"What should I focus on tomorrow?\"*\n- *\"Give me tips for building my habits\"*",
    },
  ])
  const [inputMessage, setInputMessage] = useState('')
  const chatEndRef = useRef(null)

  // Show hook error (from API calls) or local validation error
  const displayError = error || localError

  useEffect(() => {
    if (activeTab === 'chat' && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab, loading])

  function dismissError() {
    setLocalError(null)
  }

  async function handleAnalyze() {
    setAnalysisResult('')
    setLocalError(null)
    const result = await analyzeWeek()
    if (result) setAnalysisResult(result)
  }

  async function handlePlan() {
    setPlanResult('')
    setLocalError(null)
    const result = await createPlan()
    if (result) setPlanResult(result)
  }

  async function handleChatSubmit(e) {
    e.preventDefault()
    const trimmed = inputMessage.trim()
    if (!trimmed || loading) return

    const newMessages = [...messages, { role: 'user', content: trimmed }]
    setMessages(newMessages)
    setInputMessage('')
    setLocalError(null)

    // Pass up to last 10 messages as history (skip the initial welcome)
    const history = newMessages.slice(1, -1).slice(-10)
    const response = await sendChatMessage(trimmed, history)
    if (response) {
      setMessages(prev => [...prev, { role: 'coach', content: response }])
    }
    // If null, the error state from useCoach shows the error via displayError
  }

  const isLastUserMsg = messages.length > 0 && messages[messages.length - 1].role === 'user'

  return (
    <div className="page-inner" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="page-title">🤖 AI Growth Coach</h1>
          <p className="page-subtitle">Personalized guidance powered by your real GrowthOS data</p>
        </div>
      </div>

      {/* Error alert */}
      {displayError && <ErrorAlert message={displayError} onDismiss={dismissError} />}

      {/* Tabs */}
      <div className="journal-mode-tabs" style={{ marginBottom: 20 }}>
        <button
          id="coach-tab-chat"
          className={`journal-mode-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >💬 Chat</button>
        <button
          id="coach-tab-analysis"
          className={`journal-mode-tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >📊 Weekly Analysis</button>
        <button
          id="coach-tab-plan"
          className={`journal-mode-tab ${activeTab === 'plan' ? 'active' : ''}`}
          onClick={() => setActiveTab('plan')}
        >📅 Next Week&apos;s Plan</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* ─── Chat Tab ─── */}
        {activeTab === 'chat' && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
          }}>
            {/* Messages */}
            <div className="coach-messages" style={{
              flex: 1, overflowY: 'auto', padding: 20,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end',
                    gap: 8,
                  }}
                >
                  {msg.role === 'coach' && (
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--gradient-brand)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0,
                    }}>🤖</div>
                  )}
                  <div style={{
                    maxWidth: '78%',
                    padding: '12px 16px',
                    borderRadius: 16,
                    background: msg.role === 'user' ? 'var(--gradient-brand)' : 'var(--bg-surface-2)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    border: msg.role === 'coach' ? '1px solid var(--border-subtle)' : 'none',
                    borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                    borderBottomLeftRadius: msg.role === 'coach' ? 4 : 16,
                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(124,92,252,0.3)' : undefined,
                  }}>
                    {msg.role === 'coach' ? (
                      <div className="markdown-body" style={{ fontSize: 14 }}>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}
              {loading && isLastUserMsg && <TypingIndicator />}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form
              className="coach-chat-form"
              onSubmit={handleChatSubmit}
              style={{
                display: 'flex', gap: 10, padding: 16,
                borderTop: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
              }}
            >
              <input
                id="coach-chat-input"
                type="text"
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Ask your coach anything…"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                disabled={loading}
                autoComplete="off"
              />
              <button
                id="coach-chat-send"
                type="submit"
                className="btn-primary"
                disabled={!inputMessage.trim() || loading}
                style={{ width: 'auto', paddingInline: 20, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {loading && isLastUserMsg
                  ? <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Thinking…</>
                  : <>Send 🚀</>}
              </button>
            </form>
          </div>
        )}

        {/* ─── Weekly Analysis Tab ─── */}
        {activeTab === 'analysis' && (
          <div className="coach-panel" style={{
            flex: 1, overflowY: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 32,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
              <h2 className="section-title">📊 Weekly Analysis</h2>
              <button
                id="coach-btn-analyze"
                className="btn-primary"
                onClick={handleAnalyze}
                disabled={loading}
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loading && !analysisResult
                  ? <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Analyzing…</>
                  : <>✨ {analysisResult ? 'Regenerate' : 'Generate Analysis'}</>}
              </button>
            </div>

            {loading && !analysisResult ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Analyzing your week with Gemini AI…</p>
              </div>
            ) : analysisResult ? (
              <div className="markdown-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <ReactMarkdown>{analysisResult}</ReactMarkdown>
              </div>
            ) : (
              <EmptyState
                emoji="📊"
                title="Get Your Weekly Insights"
                body='Click "Generate Analysis" to get AI-powered insights on your goals, habits, and tasks from this week.'
              />
            )}
          </div>
        )}

        {/* ─── Next Week Plan Tab ─── */}
        {activeTab === 'plan' && (
          <div className="coach-panel" style={{
            flex: 1, overflowY: 'auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: 32,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
              <h2 className="section-title">📅 Next Week&apos;s Plan</h2>
              <button
                id="coach-btn-plan"
                className="btn-primary"
                onClick={handlePlan}
                disabled={loading}
                style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                {loading && !planResult
                  ? <><span className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Planning…</>
                  : <>🗓️ {planResult ? 'Regenerate' : 'Generate Plan'}</>}
              </button>
            </div>

            {loading && !planResult ? (
              <div style={{ textAlign: 'center', padding: 60 }}>
                <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Creating your personalized plan with Gemini AI…</p>
              </div>
            ) : planResult ? (
              <div className="markdown-body" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <ReactMarkdown>{planResult}</ReactMarkdown>
              </div>
            ) : (
              <EmptyState
                emoji="🗓️"
                title="Plan Your Next Week"
                body='Click "Generate Plan" to get an AI-curated plan tailored to your progress and goals.'
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
