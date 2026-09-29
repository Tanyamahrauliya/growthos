import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Initialize Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Helper to format user data for the prompt
function formatUserData(data) {
  return `
User Profile: ${JSON.stringify(data.profile)}
Goals: ${JSON.stringify(data.goals)}
Habits & Streaks: ${JSON.stringify(data.habits)}
Tasks (Recent & Pending): ${JSON.stringify(data.tasks)}
Focus Sessions (Recent): ${JSON.stringify(data.focusSessions)}
Journal Entries (Recent): ${JSON.stringify(data.journalEntries)}
  `.trim()
}

// 1. Analyze My Week
app.post('/api/coach/analyze', async (req, res) => {
  try {
    const { userData } = req.body
    const context = formatUserData(userData)
    
    const prompt = `You are an AI Growth Coach for a personal growth app. 
Analyze the following user data from the past week. 
Focus on:
1. What went well (wins, consistency)
2. Weak areas and patterns (missed tasks, broken habits)
3. 2-3 practical, actionable improvement suggestions.

User Data:
${context}

Format your response in Markdown with clear headings and bullet points. Keep it encouraging but objective.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
    
    res.json({ result: response.text })
  } catch (error) {
    console.error('Analyze Error:', error)
    res.status(500).json({ error: 'Failed to analyze data.' })
  }
})

// 2. Create Next Week's Plan
app.post('/api/coach/plan', async (req, res) => {
  try {
    const { userData } = req.body
    const context = formatUserData(userData)
    
    const prompt = `You are an AI Growth Coach. Based on the user's recent activity, suggest a realistic plan for next week.
Do NOT overload the user. Avoid unrealistic workloads based on their past completion rates.
Suggest:
1. 1-2 main focus goals for the week.
2. 3-5 specific tasks to schedule.
3. Habit adjustments (e.g., dial back if struggling, or add a new one if consistent).

User Data:
${context}

Format your response in Markdown.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
    
    res.json({ result: response.text })
  } catch (error) {
    console.error('Plan Error:', error)
    res.status(500).json({ error: 'Failed to generate plan.' })
  }
})

// 3. AI Coach Chat
app.post('/api/coach/chat', async (req, res) => {
  try {
    const { userData, message, history } = req.body
    const context = formatUserData(userData)
    
    let chatHistory = "Previous Conversation:\n"
    if (history && history.length > 0) {
      chatHistory += history.map(msg => `${msg.role === 'user' ? 'User' : 'Coach'}: ${msg.content}`).join('\n')
    }

    const prompt = `You are an AI Growth Coach. You give actionable, personalized guidance.
Use the following user data to provide context-aware answers to the user's message.
Be concise, practical, and supportive.

User Data:
${context}

${chatHistory}

User's New Message: ${message}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })
    
    res.json({ result: response.text })
  } catch (error) {
    console.error('Chat Error:', error)
    res.status(500).json({ error: 'Failed to process chat message.' })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(\`AI Coach server running on port \${PORT}\`)
})
