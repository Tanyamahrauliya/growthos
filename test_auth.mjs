import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const email = `test_${Date.now()}@gmail.com`
  const password = 'password123'
  
  console.log('Signing up with:', email)
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: 'Test User' } }
  })
  
  if (signUpError) {
    console.error('Sign up error:', signUpError.message)
    return
  }
  console.log('Sign up successful:', !!signUpData.user)
  console.log('Session present?', !!signUpData.session)
  
  console.log('Attempting to sign in...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (signInError) {
    console.error('Sign in error:', signInError.message)
  } else {
    console.log('Sign in successful!', !!signInData.session)
  }
}

test()
