import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthFlow() {
  console.log('1. Creating a temp email via mail.tm...')
  // Fetch available domains
  const domainRes = await fetch('https://api.mail.tm/domains')
  const domains = await domainRes.json()
  const domain = domains['hydra:member'][0].domain

  // Generate random email and password
  const emailName = 'testuser_' + Date.now() + Math.random().toString(36).substring(7)
  const email = `${emailName}@${domain}`
  const password = 'password123'

  // Create account on mail.tm
  const createRes = await fetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password })
  })
  if (!createRes.ok) throw new Error('Failed to create mail.tm account')

  // Get token for mail.tm
  const tokenRes = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: email, password })
  })
  const { token } = await tokenRes.json()
  
  console.log(`✅ Temp email ready: ${email}`)

  console.log('2. Signing up on Supabase...')
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Temp User' } }
  })
  if (signUpError) throw new Error('Sign up failed: ' + signUpError.message)
  console.log('✅ Sign up initiated. Waiting for email...')

  // Poll for email
  let confirmUrl = null
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const msgsRes = await fetch('https://api.mail.tm/messages', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const msgs = await msgsRes.json()
    if (msgs['hydra:member'].length > 0) {
      const msgId = msgs['hydra:member'][0].id
      const msgRes = await fetch(`https://api.mail.tm/messages/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const msg = await msgRes.json()
      
      // Extract URL from text or html
      const text = msg.text || ''
      const match = text.match(/https?:\/\/[^\s"'<]+/)
      if (match) {
        confirmUrl = match[0]
        break
      }
    }
  }

  if (!confirmUrl) {
    console.log('No confirmation email received. Maybe Email Confirmations are disabled on this project?')
    console.log('Skipping confirmation step.')
  } else {
    console.log('✅ Found confirmation link:', confirmUrl)
    console.log('3. Clicking confirmation link...')
    const confirmRes = await fetch(confirmUrl, { redirect: 'manual' })
    console.log('✅ Confirmation clicked! Status:', confirmRes.status)
  }

  console.log('4. Attempting to Sign In with the same credentials...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (signInError) {
    console.error('❌ Sign in failed:', signInError.message)
  } else {
    console.log('✅ Sign in successful!')
    console.log('Session present:', !!signInData.session)
    console.log('User ID:', signInData.user.id)
    console.log('Flow completed successfully!')
  }
}

testAuthFlow().catch(console.error)
