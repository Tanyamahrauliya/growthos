import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

// ── Startup validation ─────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.error('\n[GrowthOS] ❌ GEMINI_API_KEY is not set in .env')
  console.error('[GrowthOS]    Add GEMINI_API_KEY=your_key to .env and restart.\n')
  // Don't exit — still start so the frontend gets a clear 503 error instead of ECONNREFUSED
}

const MODEL = 'gemini-2.5-flash'

// Initialize Gemini client (only if key exists)
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// ── Health check ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    model: MODEL,
    hasApiKey: Boolean(GEMINI_API_KEY),
  })
})

// ── Middleware: block if no API key ────────────────────────────────────────
function requireAI(req, res, next) {
  if (!ai) {
    return res.status(503).json({
      error: 'AI Coach is not configured. Please add GEMINI_API_KEY to your .env file and restart the server.',
    })
  }
  next()
}

// ── Helper: call Gemini and extract text ───────────────────────────────────
async function geminiGenerate(prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  })
  const text = response.text
  if (!text) throw new Error('Gemini returned an empty response.')
  return text
}

// ── Helper: format user context for prompts ───────────────────────────────
function formatUserData(data) {
  if (!data || typeof data !== 'object') return 'No user data provided.'
  const parts = []
  if (data.profile) {
    parts.push(`User Profile: ${JSON.stringify(data.profile)}`)
  }
  if (Array.isArray(data.goals) && data.goals.length > 0) {
    parts.push(`Active Goals (${data.goals.length}): ${JSON.stringify(data.goals)}`)
  } else {
    parts.push('Active Goals: none set yet')
  }
  if (Array.isArray(data.habits) && data.habits.length > 0) {
    parts.push(`Habits & Streaks: ${JSON.stringify(data.habits)}`)
  } else {
    parts.push('Habits: none tracked yet')
  }
  if (Array.isArray(data.tasks) && data.tasks.length > 0) {
    parts.push(`Recent Tasks: ${JSON.stringify(data.tasks)}`)
  } else {
    parts.push('Recent Tasks: none this week')
  }
  if (Array.isArray(data.focusSessions) && data.focusSessions.length > 0) {
    const totalMin = data.focusSessions.reduce((s, f) => s + (Number(f.duration) || 0), 0)
    parts.push(`Focus Sessions: ${data.focusSessions.length} session(s), ${totalMin} total minutes`)
  }
  if (Array.isArray(data.journalEntries) && data.journalEntries.length > 0) {
    parts.push(`Recent Journal Entries: ${JSON.stringify(data.journalEntries)}`)
  }
  return parts.join('\n')
}

// 1. Analyze My Week
app.post('/api/coach/analyze', requireAI, async (req, res) => {
  try {
    const { userData } = req.body
    const context = formatUserData(userData || {})

    const prompt = `You are an AI Growth Coach for GrowthOS, a personal development app.
Analyze the following user data from the past week.

User Data:
${context}

Please provide:
## 🏆 Wins This Week
- What went well, highlights, and consistency streaks

## 🔍 Areas to Improve
- Patterns, missed tasks, broken habits (be kind but honest)

## 💡 3 Actionable Suggestions
- Concrete, specific steps the user can take next week

Keep your response encouraging, practical, and concise. Format in clean Markdown.`

    const result = await geminiGenerate(prompt)
    res.json({ result })
  } catch (error) {
    console.error('[GrowthOS] /api/coach/analyze error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to analyze data.' })
  }
})

// 2. Create Next Week's Plan
app.post('/api/coach/plan', requireAI, async (req, res) => {
  try {
    const { userData } = req.body
    const context = formatUserData(userData || {})

    const prompt = `You are an AI Growth Coach for GrowthOS.
Based on this user's recent activity, create a realistic and motivating plan for next week.
Do NOT overload them — base the workload on their past completion rates.

User Data:
${context}

Please provide:
## 🎯 Focus Goals
- 1-2 main things to prioritize this week

## ✅ Suggested Tasks
- 3-5 specific, actionable tasks to schedule (with rough time estimates)

## 🔁 Habit Guidance
- Reinforce strong habits, gently adjust struggling ones

Format in clean Markdown.`

    const result = await geminiGenerate(prompt)
    res.json({ result })
  } catch (error) {
    console.error('[GrowthOS] /api/coach/plan error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to generate plan.' })
  }
})

// 3. AI Coach Chat
app.post('/api/coach/chat', requireAI, async (req, res) => {
  try {
    const { userData, message, history } = req.body
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty.' })
    }

    const context = formatUserData(userData || {})
    const historyText = Array.isArray(history) && history.length > 0
      ? '\nRecent Conversation:\n' + history.map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n')
      : ''

    const prompt = `You are an AI Growth Coach inside GrowthOS — a personal development app.
You are supportive, concise, and data-aware. Use the user's real data to give personalized guidance.

User's GrowthOS Data:
${context}
${historyText}

User's Message: ${message.trim()}

Respond helpfully and concisely. Use Markdown for formatting when it improves clarity.`

    const result = await geminiGenerate(prompt)
    res.json({ result })
  } catch (error) {
    console.error('[GrowthOS] /api/coach/chat error:', error.message)
    res.status(500).json({ error: error.message || 'Failed to process message.' })
  }
})

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` })
})

// ── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001

if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL) {
  app.listen(PORT, () => {
    console.log(`\n🤖 [GrowthOS] AI Coach server running on http://localhost:${PORT}`)
    console.log(`   Model    : ${MODEL}`)
    console.log(`   API Key  : ${GEMINI_API_KEY ? '✅ loaded' : '❌ MISSING — add GEMINI_API_KEY to .env'}\n`)
  })
}

// Export for Vercel Serverless Functions
export default app;
